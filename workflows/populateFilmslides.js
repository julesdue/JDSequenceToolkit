const ppro = require('premierepro');
const { memoryStorage } = require('../lib/memoryStorage.js');
const { parseCSV } = require('../lib/parseCSV.js');
const { fuzzyMatch } = require('../lib/fuzzyMatch.js');
const { getMogrtParams } = require('../lib/getMogrtParams.js');
const { findMogrtInSequence } = require('../lib/findMogrtInSequence.js');
const { changeMogrtParam } = require('../lib/changeMogrtParam.js');
const { executeCompoundAction } = require('../lib/executeCompoundAction.js');

async function populateFilmslides(folderItem) {
  try {
    console.log('🎬 populateFilmslides workflow started');

    const csvData = memoryStorage.getCsvData();
    const mappingSelection = memoryStorage.getMappingSelection();

    if (!csvData || !csvData.data || csvData.data.length === 0) {
      throw new Error('No CSV data loaded. Please load a CSV file first.');
    }

    if (!mappingSelection) {
      throw new Error('No mapping selected. Please configure the parameter mapping.');
    }

    if (!folderItem) {
      throw new Error('No folder provided');
    }

    console.log(`📁 Processing folder: ${folderItem.name}`);
    console.log(`📊 CSV data: ${csvData.data.length} rows`);
    console.log('🗺️  Mapping:', mappingSelection);

    // Get all sequences in folder
    const items = await folderItem.getItems();
    console.log(`📦 Total items in folder: ${items.length}`);

    // Since user confirmed these ARE sequences, just use them directly
    const sequences = items;

    // Debug: log items
    items.forEach((item, idx) => {
      console.log(`  [${idx}] ${item.name}`);
      // Log available methods
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(item))
        .filter(m => typeof item[m] === 'function')
        .slice(0, 5);
      console.log(`       Methods: ${methods.join(', ')}`);
    });

    console.log(`📹 Found ${sequences.length} sequences in folder`);

    if (sequences.length === 0) {
      throw new Error(`No sequences found in folder "${folderItem.name}"`);
    }

    let successCount = 0;
    let skipCount = 0;

    const project = await ppro.Project.getActiveProject();

    // Process each sequence
    for (const sequenceItem of sequences) {
      try {
        const sequenceName = sequenceItem.name;
        console.log(`\n🔄 Processing sequence: "${sequenceName}"`);

        // Fuzzy match sequence name to CSV film title
        const filmTitleColumn = 'Titel'; // CSV column for film title
        const csvFilmTitles = csvData.data.map(row => row[filmTitleColumn]);
        const matchedFilmTitle = fuzzyMatch(sequenceName, csvFilmTitles);

        if (!matchedFilmTitle) {
          console.log(`⚠️  No matching film title found for sequence "${sequenceName}"`);
          skipCount++;
          continue;
        }

        // Find CSV row with matching film title
        const csvRow = csvData.data.find(row => row[filmTitleColumn] === matchedFilmTitle);
        if (!csvRow) {
          console.log(`⚠️  CSV row not found for "${matchedFilmTitle}"`);
          skipCount++;
          continue;
        }

        console.log(`✅ Matched to film: "${matchedFilmTitle}"`);

        // Open the sequence - get the actual Sequence object
        let sequence;
        try {
          // Method 1: Try project.openSequence
          if (typeof project.openSequence === 'function') {
            sequence = await project.openSequence(sequenceItem);
            console.log(`  openSequence returned: ${sequence ? 'Sequence object' : 'null'}`);
          }
        } catch (e) {
          console.log(`  openSequence error: ${e.message}`);
        }

        // Method 2: Try to get sequence from item
        if (!sequence && typeof sequenceItem.getSequence === 'function') {
          try {
            sequence = await sequenceItem.getSequence();
            console.log(`  getSequence returned: ${sequence ? 'Sequence object' : 'null'}`);
          } catch (e) {
            console.log(`  getSequence error: ${e.message}`);
          }
        }

        // Method 3: Try to access the sequence via getProject
        if (!sequence && typeof sequenceItem.getProject === 'function') {
          try {
            const seqProject = await sequenceItem.getProject();
            const allSequences = await seqProject.getSequences();
            sequence = allSequences.find(seq => seq.name === sequenceName);
            console.log(`  Found via getProject: ${sequence ? 'Sequence object' : 'not found'}`);
          } catch (e) {
            console.log(`  getProject error: ${e.message}`);
          }
        }

        if (!sequence) {
          console.log(`⚠️  Could not load sequence "${sequenceName}"`);
          skipCount++;
          continue;
        }

        // CRITICAL: Activate the sequence so MOGRT components initialize
        try {
          if (typeof project.setActiveSequence === 'function') {
            await project.setActiveSequence(sequence);
            console.log(`  ✅ Sequence activated: "${sequenceName}"`);
          }
        } catch (e) {
          console.log(`  ⚠️ Could not activate sequence: ${e.message}`);
        }

        // Find MOGRT in sequence
        const mogrtResult = await findMogrtInSequence(sequence, project);
        if (!mogrtResult) {
          console.log(`⚠️  No MOGRT found in sequence "${sequenceName}"`);
          skipCount++;
          continue;
        }

        const { clip, projectItem } = mogrtResult;

        // Get MOGRT parameters — try component chain first, then projectItem
        let component = mogrtResult.component;
        if (!component && projectItem) {
          component = projectItem;
          console.log(`  Using projectItem as parameter source`);
        }
        if (!component) {
          console.log(`⚠️  No component or projectItem for MOGRT`);
          skipCount++;
          continue;
        }

        const params = await getMogrtParams(component);
        if (params.length === 0) {
          console.log(`⚠️  No parameters found in MOGRT`);
          skipCount++;
          continue;
        }

        // Create actions for all parameter updates
        const actions = [];

        for (const [mogrtParamName, csvColumnName] of Object.entries(mappingSelection)) {
          if (!csvColumnName) continue; // Skip unmapped parameters

          const csvValue = csvRow[csvColumnName];
          if (!csvValue) {
            console.log(`  ⚠️  Empty value for "${mogrtParamName}" (CSV column: "${csvColumnName}")`);
            continue;
          }

          // Find matching MOGRT parameter
          const paramObj = params.find(p => p.displayName === mogrtParamName);
          if (!paramObj) {
            console.log(`  ⚠️  MOGRT parameter "${mogrtParamName}" not found`);
            continue;
          }

          console.log(`  📝 Setting "${mogrtParamName}" = "${csvValue}"`);

          // Create action for this parameter
          try {
            const keyframe = paramObj.param.createKeyframe(csvValue);
            const action = paramObj.param.createSetValueAction(keyframe, false);
            actions.push(action);
          } catch (err) {
            console.error(`  ❌ Error creating action for "${mogrtParamName}":`, err);
          }
        }

        // Execute all actions in a transaction if there are any
        if (actions.length > 0) {
          const compound = new ppro.CompoundAction("Update MOGRT parameters");
          for (const action of actions) {
            compound.addAction(action);
          }
          await project.executeAction(compound);
          console.log(`✅ Updated ${actions.length} parameters for sequence "${sequenceName}"`);
          successCount++;
        } else {
          console.log(`⚠️  No parameters updated for sequence "${sequenceName}"`);
          skipCount++;
        }
      } catch (err) {
        console.error(`❌ Error processing sequence:`, err);
        skipCount++;
      }
    }

    // Summary
    console.log(`\n✅ Workflow complete: ${successCount} sequences updated, ${skipCount} skipped`);
    return {
      success: true,
      successCount,
      skipCount,
      message: `Updated ${successCount} sequences, skipped ${skipCount}`
    };
  } catch (err) {
    console.error('❌ populateFilmslides error:', err);
    return {
      success: false,
      error: err.message
    };
  } finally {
    // Cleanup memory
    memoryStorage.reset();
  }
}

module.exports = { populateFilmslides };

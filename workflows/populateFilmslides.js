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

    // Debug: log all items
    items.forEach((item, idx) => {
      console.log(`  [${idx}] ${item.name} (type: ${item.constructor.name})`);
    });

    const sequences = items.filter(item => {
      try {
        const sequenceItem = ppro.SequenceItem.cast(item);
        console.log(`    Casting "${item.name}": ${sequenceItem ? 'SUCCESS (SequenceItem)' : 'FAILED'}`);
        return sequenceItem !== null;
      } catch (e) {
        console.log(`    Casting "${item.name}": ERROR - ${e.message}`);
        return false;
      }
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

        // Load sequence
        const sequence = await sequenceItem.getSequence();
        if (!sequence) {
          console.log(`⚠️  Could not load sequence "${sequenceName}"`);
          skipCount++;
          continue;
        }

        // Find MOGRT in sequence
        const mogrtResult = await findMogrtInSequence(sequence);
        if (!mogrtResult) {
          console.log(`⚠️  No MOGRT found in sequence "${sequenceName}"`);
          skipCount++;
          continue;
        }

        const { clip, component } = mogrtResult;

        // Get MOGRT parameters
        const params = getMogrtParams(component);
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
          await project.lockedAccess(async () => {
            await project.executeTransaction(async (compoundAction) => {
              for (const action of actions) {
                compoundAction.addAction(action);
              }
            });
          });
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

const ppro = require('premierepro');
const { memoryStorage } = require('../lib/memoryStorage.js');
const { parseCSV } = require('../lib/parseCSV.js');
const { fuzzyMatch } = require('../lib/fuzzyMatch.js');
const { getMogrtParams } = require('../lib/getMogrtParams.js');
const { findMogrtInSequence } = require('../lib/findMogrtInSequence.js');
const { changeMogrtParam } = require('../lib/changeMogrtParam.js');
const { executeCompoundAction } = require('../lib/executeCompoundAction.js');
const { canUseExecuteScript } = require('../lib/canUseExecuteScript.js');

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

        const { clip, projectItem, trackIndex, clipIndex } = mogrtResult;
        const mogrtComp = mogrtResult.component; // The "Grafikparameter" component

        // === Deep introspection: projectItem (the ClipProjectItem for the MOGRT) ===
        console.log(`  🔬 Inspecting projectItem for MGT properties`);
        if (projectItem) {
          const piMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(projectItem))
            .filter(n => typeof projectItem[n] === 'function');
          console.log(`     ProjectItem methods: ${piMethods.join(', ')}`);

          // Try MGT-specific methods
          for (const m of ['getMogrtParameters', 'getMogrtParameter', 'setMogrtParameter', 'getProperties', 'getMGTComponent']) {
            if (typeof projectItem[m] === 'function') {
              console.log(`     ✨ projectItem.${m} EXISTS`);
              try {
                const r = await projectItem[m]();
                console.log(`        → ${typeof r}, keys: ${r ? Object.keys(r).slice(0, 10).join(',') : 'null'}`);
              } catch (e) {
                console.log(`        → error: ${e.message}`);
              }
            }
          }
        }

        // === Deep introspection: clip ===
        console.log(`  🔬 Inspecting clip for MGT access`);
        if (clip) {
          const clipMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(clip))
            .filter(n => typeof clip[n] === 'function');
          console.log(`     Clip methods (${clipMethods.length}): ${clipMethods.join(', ')}`);
        }

        // === NEW API PATH: comp.getProperties() + param.setValue() ===
        // The MOGRT component (already found via getComponentChain) likely exposes getProperties()
        // Reference: docs/use-classes.md lines 58-70
        console.log(`  🔬 Inspecting MOGRT component for new API`);
        if (mogrtComp) {
          const compMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(mogrtComp))
            .filter(n => typeof mogrtComp[n] === 'function');
          console.log(`     Component methods: ${compMethods.join(', ')}`);
          console.log(`     Component type: ${mogrtComp.type}`);
          console.log(`     Component displayName: ${mogrtComp.displayName}`);
        }

        if (mogrtComp && typeof mogrtComp.getProperties === 'function') {
          console.log(`  🆕 Trying mogrtComp.getProperties() + setValue() path`);
          try {
            const properties = await mogrtComp.getProperties();
            console.log(`     Got ${properties?.length || 0} properties`);

            if (properties && properties.length > 0) {
              // Introspect first property
              const first = properties[0];
              console.log(`     First prop: displayName="${first.displayName}", methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(first)).filter(n => typeof first[n] === 'function').join(', ')}`);

              let altSuccessCount = 0;
              for (const [mogrtParamName, csvColumnName] of Object.entries(mappingSelection)) {
                if (!csvColumnName) continue;
                const csvValue = csvRow[csvColumnName];
                if (!csvValue) continue;

                const textParam = properties.find(p => p.displayName === mogrtParamName);
                if (!textParam) {
                  console.log(`     ⚠️  "${mogrtParamName}" not found via getProperties`);
                  continue;
                }

                console.log(`     📝 setValue on "${mogrtParamName}" = "${csvValue}"`);
                try {
                  if (typeof textParam.setValue === 'function') {
                    await textParam.setValue(String(csvValue));
                    altSuccessCount++;
                    console.log(`     ✅ "${mogrtParamName}" set via setValue()`);
                  } else {
                    console.log(`     ⚠️  No setValue() method on param`);
                  }
                } catch (e) {
                  console.error(`     ❌ setValue failed for "${mogrtParamName}":`, e.message);
                }
              }

              if (altSuccessCount > 0) {
                console.log(`✅ Updated ${altSuccessCount} parameters via getProperties() API for sequence "${sequenceName}"`);
                successCount++;
                continue;
              }
            }
          } catch (e) {
            console.log(`  ⚠️  getProperties() path failed: ${e.message}`);
          }
        } else {
          console.log(`  ⚠️  mogrtComp.getProperties not available`);
        }

        // Get MOGRT parameters — try component chain first, then projectItem as fallback
        let params = [];
        const component = mogrtResult.component;

        if (component) {
          console.log(`  🔎 Trying component chain for params`);
          params = await getMogrtParams(component);
        }

        // Check if we found the expected text params; if not, try projectItem
        const expectedParamNames = Object.keys(mappingSelection);
        const foundExpected = params.some(p => expectedParamNames.includes(p.displayName));

        if (!foundExpected && projectItem) {
          console.log(`  🔎 Component chain didn't yield expected params, trying projectItem`);
          const projectItemParams = await getMogrtParams(projectItem);
          if (projectItemParams.length > 0) {
            const projectItemHasExpected = projectItemParams.some(p => expectedParamNames.includes(p.displayName));
            if (projectItemHasExpected || params.length === 0) {
              params = projectItemParams;
              console.log(`  ✅ Using projectItem params (${params.length} found)`);
            }
          }
        }

        // Final fallback: try the clip itself (might have getMGTComponent)
        const stillNotFound = !params.some(p => expectedParamNames.includes(p.displayName));
        if (stillNotFound && clip) {
          console.log(`  🔎 Trying clip directly for MGT component`);
          const clipParams = await getMogrtParams(clip);
          if (clipParams.length > 0) {
            const clipHasExpected = clipParams.some(p => expectedParamNames.includes(p.displayName));
            if (clipHasExpected) {
              params = clipParams;
              console.log(`  ✅ Using clip MGT params (${params.length} found)`);
            }
          }
        }

        if (params.length === 0) {
          console.log(`⚠️  No parameters found in MOGRT`);
          skipCount++;
          continue;
        }

        console.log(`  📋 Final param list: ${params.map(p => p.displayName).join(', ')}`);

        // Check if JSX path is available
        const useJsxPath = await canUseExecuteScript();

        if (useJsxPath) {
          // JSX path: direct param mutation via ExtendScript (each update is a separate undo step)
          console.log(`  🌉 Using ExtendScript JSX path`);
          let jsxSuccessCount = 0;

          for (const [mogrtParamName, csvColumnName] of Object.entries(mappingSelection)) {
            if (!csvColumnName) continue;

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

            // Use JSX path with track/clip indices
            const success = await changeMogrtParam(paramObj.param, csvValue, {
              trackIdx: trackIndex,
              clipIdx: clipIndex,
              paramName: mogrtParamName
            });

            if (success) {
              jsxSuccessCount++;
            }
          }

          if (jsxSuccessCount > 0) {
            console.log(`✅ Updated ${jsxSuccessCount} parameters (JSX) for sequence "${sequenceName}"`);
            successCount++;
          } else {
            console.log(`⚠️  No parameters updated for sequence "${sequenceName}"`);
            skipCount++;
          }
        } else {
          // UXP path: compound action with traditional action-based mutations
          console.log(`  ⚙️  Using UXP action path`);
          const actions = [];

          for (const [mogrtParamName, csvColumnName] of Object.entries(mappingSelection)) {
            if (!csvColumnName) continue;

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

            // Create action for this parameter — handle JSON text params (CLAUDE.md gotcha #4)
            try {
              const param = paramObj.param;

              // INTROSPECTION: dump all methods/properties on the param object
              if (mogrtParamName === 'Titel') {
                console.log(`    🔬 Param introspection for "${mogrtParamName}":`);
                const proto = Object.getPrototypeOf(param);
                const protoMethods = proto ? Object.getOwnPropertyNames(proto).filter(n => typeof param[n] === 'function') : [];
                console.log(`       Methods: ${protoMethods.join(', ')}`);
                const ownProps = Object.getOwnPropertyNames(param);
                console.log(`       Own props: ${ownProps.join(', ')}`);
                // Try some common property accesses
                for (const prop of ['displayName', 'name', 'type', 'paramType', 'kind', 'valueType', 'isTimeVarying']) {
                  try {
                    const v = param[prop];
                    if (v !== undefined) console.log(`       ${prop}: ${typeof v === 'function' ? '(fn)' : JSON.stringify(v)}`);
                  } catch (_) {}
                }
                // Try getStartValue with full dump
                try {
                  const sv = await param.getStartValue();
                  console.log(`       getStartValue(): ${JSON.stringify(sv, null, 2).substring(0, 500)}`);
                } catch (e) { console.log(`       getStartValue err: ${e.message}`); }

                // Try getValue if it exists
                if (typeof param.getValue === 'function') {
                  try {
                    const v = await param.getValue();
                    console.log(`       getValue(): ${JSON.stringify(v).substring(0, 200)}`);
                  } catch (e) { console.log(`       getValue err: ${e.message}`); }
                }
              }

              let valueToSet = String(csvValue);

              // Try to read current value
              let currentVal = null;
              try {
                const startKF = await param.getStartValue();
                currentVal = startKF?.value?.value ?? startKF?.value ?? startKF;
                console.log(`    Current value type: ${typeof currentVal}, sample: ${String(currentVal).substring(0, 80)}`);
              } catch (_) {}

              // If we got a JSON string, parse and update
              if (currentVal && typeof currentVal === 'string') {
                try {
                  const parsed = JSON.parse(currentVal);
                  if (parsed && typeof parsed === 'object') {
                    if ('text' in parsed) parsed.text = String(csvValue);
                    else if ('textEditValue' in parsed) parsed.textEditValue = String(csvValue);
                    else parsed.text = String(csvValue);
                    valueToSet = JSON.stringify(parsed);
                    console.log(`    Wrapped in JSON (existing schema)`);
                  }
                } catch (_) {}
              }

              // Try multiple value formats — MOGRT text params likely need TextSegments
              const csvStr = String(csvValue);
              const candidates = [];

              // Try ppro.TextSegments — the typed text value class
              if (typeof ppro.TextSegments === 'function') {
                if (mogrtParamName === 'Titel') {
                  console.log(`    🧪 Inspecting TextSegments class:`);
                  const tsKeys = Object.getOwnPropertyNames(ppro.TextSegments).filter(k => k !== 'length' && k !== 'name' && k !== 'prototype');
                  console.log(`       Static members: ${tsKeys.join(', ')}`);
                  const tsProtoKeys = ppro.TextSegments.prototype ? Object.getOwnPropertyNames(ppro.TextSegments.prototype).filter(k => k !== 'constructor') : [];
                  console.log(`       Proto members: ${tsProtoKeys.join(', ')}`);

                  // Try to read existing TextSegments via exportToJSON to see the schema
                  try {
                    const empty = new ppro.TextSegments();
                    console.log(`       new TextSegments() ok, type: ${typeof empty}`);
                    const emptyKeys = Object.getOwnPropertyNames(empty);
                    console.log(`       Own props: ${emptyKeys.join(', ')}`);
                    const emptyProtoKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(empty));
                    console.log(`       Proto props: ${emptyProtoKeys.join(', ')}`);
                    // Try calling instance exportToJSON
                    try {
                      const j = empty.exportToJSON();
                      console.log(`       empty.exportToJSON() = ${JSON.stringify(j).substring(0, 500)}`);
                    } catch (e) {
                      console.log(`       empty.exportToJSON() err: ${e.message}`);
                    }
                  } catch (e) {
                    console.log(`       new TextSegments() (no args) err: ${e.message}`);
                  }

                  // Try calling exportToJSON on the param's current value
                  try {
                    const startKF = await param.getStartValue();
                    console.log(`       Param startKF: ${typeof startKF}, keys: ${startKF ? Object.keys(startKF).slice(0,10).join(',') : 'null'}`);
                    if (startKF && typeof startKF.exportToJSON === 'function') {
                      console.log(`       startKF.exportToJSON() = ${JSON.stringify(startKF.exportToJSON()).substring(0, 500)}`);
                    }
                    if (startKF?.value && typeof startKF.value.exportToJSON === 'function') {
                      console.log(`       startKF.value.exportToJSON() = ${JSON.stringify(startKF.value.exportToJSON()).substring(0, 500)}`);
                    }
                  } catch (e) {
                    console.log(`       Probing startKF err: ${e.message}`);
                  }
                }

                // Try importFromJSON with extra args (it complained about "Not Enough Parameters")
                try {
                  if (typeof ppro.TextSegments.importFromJSON === 'function') {
                    const json = JSON.stringify({ text: csvStr });
                    // Maybe it needs (jsonString, otherArg)?
                    const ts = ppro.TextSegments.importFromJSON(json, json);
                    candidates.push({ label: 'TextSegments.importFromJSON(json, json)', value: ts });
                  }
                } catch (e) { console.log(`    importFromJSON(j,j) err: ${e.message}`); }

                // Try instance method on empty TextSegments
                try {
                  const ts = new ppro.TextSegments();
                  if (typeof ts.importFromJSON === 'function') {
                    // Maybe instance method takes the JSON
                    ts.importFromJSON(JSON.stringify({ text: csvStr }));
                    candidates.push({ label: 'new TextSegments() + instance importFromJSON', value: ts });
                  }
                } catch (e) { console.log(`    instance importFromJSON err: ${e.message}`); }

                // The exposed methods are addEventListener/importFromJSON/exportToJSON
                // importFromJSON is on STATIC, so likely TextSegments.importFromJSON(jsonOrObj) → TextSegments instance

                // Pattern A: static factory with JSON string
                try {
                  if (typeof ppro.TextSegments.importFromJSON === 'function') {
                    const json1 = JSON.stringify({ text: csvStr });
                    const ts = ppro.TextSegments.importFromJSON(json1);
                    candidates.push({ label: `TextSegments.importFromJSON({text:str})`, value: ts });
                  }
                } catch (e) { console.log(`    importFromJSON({text:str}) err: ${e.message}`); }

                // Pattern B: with segments array
                try {
                  if (typeof ppro.TextSegments.importFromJSON === 'function') {
                    const json2 = JSON.stringify({ segments: [{ text: csvStr }] });
                    const ts = ppro.TextSegments.importFromJSON(json2);
                    candidates.push({ label: `TextSegments.importFromJSON({segments})`, value: ts });
                  }
                } catch (e) { console.log(`    importFromJSON({segments}) err: ${e.message}`); }

                // Pattern C: passing an instance method approach
                try {
                  const ts = new ppro.TextSegments();
                  if (typeof ts.importFromJSON === 'function') {
                    ts.importFromJSON(JSON.stringify({ text: csvStr }));
                    candidates.push({ label: `new TextSegments() + importFromJSON({text})`, value: ts });
                  }
                } catch (e) { console.log(`    new + importFromJSON err: ${e.message}`); }

                // Pattern D: importFromJSON with raw object
                try {
                  if (typeof ppro.TextSegments.importFromJSON === 'function') {
                    const ts = ppro.TextSegments.importFromJSON({ text: csvStr });
                    candidates.push({ label: `TextSegments.importFromJSON(obj)`, value: ts });
                  }
                } catch (e) { console.log(`    importFromJSON(obj) err: ${e.message}`); }
              }

              // Fallback string-based candidates
              candidates.push({ label: 'raw string', value: valueToSet });
              candidates.push({ label: 'json text wrapper', value: JSON.stringify({ text: csvStr }) });

              let keyframe = null;
              let action = null;
              let usedFormat = null;

              for (const candidate of candidates) {
                try {
                  keyframe = param.createKeyframe(candidate.value);
                  action = param.createSetValueAction(keyframe, false);
                  usedFormat = candidate.label;
                  break;
                } catch (e) {
                  console.log(`    Format "${candidate.label}" failed: ${e.message}`);
                }
              }

              if (action) {
                console.log(`    ✅ Used format: ${usedFormat}`);
                actions.push(action);
              } else {
                console.error(`  ❌ All formats failed for "${mogrtParamName}"`);
              }
            } catch (err) {
              console.error(`  ❌ Error creating action for "${mogrtParamName}":`, err.message);
            }
          }

          if (actions.length > 0) {
            const compound = new ppro.CompoundAction("Update MOGRT parameters");
            for (const action of actions) {
              compound.addAction(action);
            }
            await project.executeAction(compound);
            console.log(`✅ Updated ${actions.length} parameters (UXP) for sequence "${sequenceName}"`);
            successCount++;
          } else {
            console.log(`⚠️  No parameters updated for sequence "${sequenceName}"`);
            skipCount++;
          }
        }
      } catch (err) {
        console.error(`❌ Error processing sequence:`, err);
        skipCount++;
      }
    }

    // Summary with diagnostic info
    console.log(`\n✅ Workflow complete: ${successCount} sequences updated, ${skipCount} skipped`);

    if (successCount === 0) {
      console.log('\n⚠️  DIAGNOSTIC INFO:');
      console.log(`   Expected parameters: ${Object.keys(mappingSelection).join(', ')}`);
      console.log(`   This workflow requires a MOGRT with these exact parameter names.`);
      console.log(`   If your MOGRT doesn't have these parameters, you need to:`);
      console.log(`   1. Open the MOGRT in After Effects`);
      console.log(`   2. Add Text layers or other parameters with these names`);
      console.log(`   3. Make sure they're exposed as editable parameters in Premiere Pro`);
    }

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

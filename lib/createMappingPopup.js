/**
 * createMappingPopup.js
 *
 * Creates a modal UI for mapping CSV columns to MOGRT parameters.
 * Uses fuzzy matching to pre-select likely matches. Returns Promise resolving to mapping object.
 * Dark theme styled for UXP plugin environment.
 *
 * Usage:
 *   const mapping = await createMappingPopup(headers, mogrtParams);
 *   // mapping: { "Titel": "Title", "Regie": "Director", ... }
 */

const { fuzzyMatch } = require('./fuzzyMatch.js');

/**
 * Create and display CSV-to-MOGRT parameter mapping modal
 * @param {Array<string>} csvHeaders - CSV column headers
 * @param {Array<Object>} mogrtParams - MOGRT parameters (optional, uses hardcoded list)
 * @returns {Promise<Object>} { mogrtParamName: csvColumnName } mapping on confirm, rejects on cancel
 */
function createMappingPopup(csvHeaders, mogrtParams) {
  return new Promise((resolve, reject) => {
    try {
      // Hardcoded MOGRT param list
      const mogrtParamList = ['Titel', 'Regie', 'Land', 'Dauer', 'Kategorie'];

      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.id = 'mapping-modal-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        font-family: Adobe Clean, adobe-clean, sans-serif;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 20px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
      `;

      const title = document.createElement('h3');
      title.textContent = 'Map CSV Columns to MOGRT Parameters';
      title.style.cssText = 'margin: 0 0 20px 0; color: rgba(255, 255, 255, 1); font-size: 16px; font-weight: 700;';
      modal.appendChild(title);

      const description = document.createElement('p');
      description.textContent = 'Select which CSV column corresponds to each MOGRT parameter. Fuzzy matching has pre-selected likely matches.';
      description.style.cssText = 'margin: 0 0 20px 0; color: rgba(255, 255, 255, 0.7); font-size: 12px; line-height: 1.5;';
      modal.appendChild(description);

      const container = document.createElement('div');
      container.style.cssText = 'display: flex; gap: 20px; margin-bottom: 20px;';

      // Left column: MOGRT params
      const leftCol = document.createElement('div');
      leftCol.style.cssText = 'flex: 1;';
      const leftTitle = document.createElement('strong');
      leftTitle.textContent = 'MOGRT Parameters';
      leftTitle.style.cssText = 'display: block; margin-bottom: 10px; color: rgba(255, 255, 255, 1); font-size: 12px; font-weight: 700;';
      leftCol.appendChild(leftTitle);
      container.appendChild(leftCol);

      // Right column: CSV header dropdowns
      const rightCol = document.createElement('div');
      rightCol.style.cssText = 'flex: 1;';
      const rightTitle = document.createElement('strong');
      rightTitle.textContent = 'CSV Columns';
      rightTitle.style.cssText = 'display: block; margin-bottom: 10px; color: rgba(255, 255, 255, 1); font-size: 12px; font-weight: 700;';
      rightCol.appendChild(rightTitle);
      container.appendChild(rightCol);

      modal.appendChild(container);

      // Create mapping rows
      const mapping = {};
      const mappingContainer = document.createElement('div');

      mogrtParamList.forEach(paramName => {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; gap: 10px; align-items: center; margin-bottom: 10px;';

        const label = document.createElement('div');
        label.textContent = paramName;
        label.style.cssText = 'flex: 1; color: rgba(255, 255, 255, 0.9); font-size: 12px;';
        row.appendChild(label);

        const select = document.createElement('select');
        select.style.cssText = `
          flex: 1;
          padding: 4px 8px;
          background-color: transparent;
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          font-size: 12px;
          font-family: Adobe Clean, adobe-clean, sans-serif;
          transition: all 0.2s ease;
        `;

        select.addEventListener('hover', function() {
          this.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        });

        select.addEventListener('focus', function() {
          this.style.outline = 'none';
          this.style.borderColor = 'rgba(255, 255, 255, 0.8)';
          this.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.1)';
        });

        select.addEventListener('blur', function() {
          this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          this.style.boxShadow = 'none';
        });

        // Add empty option
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '(none)';
        select.appendChild(emptyOption);

        // Add CSV header options
        csvHeaders.forEach(header => {
          const option = document.createElement('option');
          option.value = header;
          option.textContent = header;
          select.appendChild(option);
        });

        // Fuzzy match and pre-select
        const bestMatch = fuzzyMatch(paramName, csvHeaders);
        if (bestMatch) {
          select.value = bestMatch;
        }

        select.addEventListener('change', (e) => {
          mapping[paramName] = e.target.value || null;
        });

        // Initialize mapping
        mapping[paramName] = select.value || null;

        row.appendChild(select);
        mappingContainer.appendChild(row);
      });

      modal.appendChild(mappingContainer);

      // Buttons
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px;';

      const cancelBtn = document.createElement('my-button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', () => {
        overlay.remove();
        reject(new Error('Mapping cancelled by user'));
      });
      buttonContainer.appendChild(cancelBtn);

      const okBtn = document.createElement('my-button');
      okBtn.textContent = 'OK';
      okBtn.addEventListener('click', () => {
        overlay.remove();
        console.log('✅ Mapping confirmed:', mapping);
        resolve(mapping);
      });
      buttonContainer.appendChild(okBtn);

      modal.appendChild(buttonContainer);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { createMappingPopup };

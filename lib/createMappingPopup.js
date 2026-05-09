const { fuzzyMatch } = require('./fuzzyMatch.js');

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
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: #1d1d1d;
        border: 1px solid #454545;
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
      title.style.cssText = 'margin: 0 0 20px 0; color: #f0f0f0;';
      modal.appendChild(title);

      const description = document.createElement('p');
      description.textContent = 'Select which CSV column corresponds to each MOGRT parameter. Fuzzy matching has pre-selected likely matches.';
      description.style.cssText = 'margin: 0 0 20px 0; color: #b3b3b3; font-size: 12px;';
      modal.appendChild(description);

      const container = document.createElement('div');
      container.style.cssText = 'display: flex; gap: 20px; margin-bottom: 20px;';

      // Left column: MOGRT params
      const leftCol = document.createElement('div');
      leftCol.style.cssText = 'flex: 1;';
      const leftTitle = document.createElement('strong');
      leftTitle.textContent = 'MOGRT Parameters';
      leftTitle.style.cssText = 'display: block; margin-bottom: 10px; color: #f0f0f0;';
      leftCol.appendChild(leftTitle);
      container.appendChild(leftCol);

      // Right column: CSV header dropdowns
      const rightCol = document.createElement('div');
      rightCol.style.cssText = 'flex: 1;';
      const rightTitle = document.createElement('strong');
      rightTitle.textContent = 'CSV Columns';
      rightTitle.style.cssText = 'display: block; margin-bottom: 10px; color: #f0f0f0;';
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
        label.style.cssText = 'flex: 1; color: #f0f0f0; font-size: 13px;';
        row.appendChild(label);

        const select = document.createElement('select');
        select.style.cssText = `
          flex: 1;
          padding: 6px;
          background: #2d2d2d;
          color: #f0f0f0;
          border: 1px solid #454545;
          border-radius: 4px;
          font-size: 12px;
        `;

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
      buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.cssText = `
        padding: 8px 16px;
        background: #454545;
        color: #f0f0f0;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      `;
      cancelBtn.addEventListener('click', () => {
        overlay.remove();
        reject(new Error('Mapping cancelled by user'));
      });
      buttonContainer.appendChild(cancelBtn);

      const okBtn = document.createElement('button');
      okBtn.textContent = 'OK';
      okBtn.style.cssText = `
        padding: 8px 16px;
        background: #2a7f62;
        color: #f0f0f0;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
      `;
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

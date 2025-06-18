document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selection ---
    const recipeTypeSelect = document.getElementById('recipe-type-select');
    const craftingUI = document.getElementById('crafting-ui');
    const brewingUI = document.getElementById('brewing-ui');
    const smeltingUI = document.getElementById('smelting-ui');
    
    // Crafting
    const shapedBtn = document.getElementById('shaped-btn');
    const shapelessBtn = document.getElementById('shapeless-btn');
    const shapedRecipeUI = document.getElementById('shaped-recipe-ui');
    const shapelessRecipeUI = document.getElementById('shapeless-recipe-ui');
    const craftingGridInputs = document.querySelectorAll('.grid-input');
    const keyMappingArea = document.getElementById('key-mapping-area');
    const ingredientsList = document.getElementById('ingredients-list');
    const addIngredientBtn = document.getElementById('add-ingredient-btn');

    // Shared Inputs
    const identifierInput = document.getElementById('identifier-input');
    const outputItemInput = document.getElementById('output-item-input');
    const outputCountInput = document.getElementById('output-count-input');
    const priorityInput = document.getElementById('priority-input');
    
    // Unlock
    const unlockItemsContainer = document.getElementById('unlock-items-container');
    const addUnlockBtn = document.getElementById('add-unlock-btn');

    // Process & Output
    const processBtn = document.getElementById('process-btn');
    const jsonOutputArea = document.getElementById('json-output-area');
    const jsonCode = document.getElementById('json-code');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');

    // Sidebar
    const menuButton = document.getElementById('menu-button');
    const sidebar = document.getElementById('sidebar');

    // --- State ---
    let isShaped = true;

    // --- Event Listeners ---

    // Main UI switcher
    recipeTypeSelect.addEventListener('change', updateUIVisibility);

    // Crafting type switcher
    shapedBtn.addEventListener('click', () => switchCraftingType(true));
    shapelessBtn.addEventListener('click', () => switchCraftingType(false));
    
    // Dynamic key mapping for shaped crafting
    craftingGridInputs.forEach(input => input.addEventListener('input', updateKeyMappings));

    // Dynamic ingredients for shapeless crafting
    addIngredientBtn.addEventListener('click', addIngredient);

    // Unlock items
    addUnlockBtn.addEventListener('click', addUnlockItem);

    // Main process button
    processBtn.addEventListener('click', processRecipe);

    // Output buttons
    copyBtn.addEventListener('click', copyJson);
    downloadBtn.addEventListener('click', downloadJson);
    
    // Sidebar toggle
    menuButton.addEventListener('click', toggleSidebar);
    document.getElementById('home-link').addEventListener('click', () => location.reload());

    // --- Core Functions ---

    function updateUIVisibility() {
        const selectedType = recipeTypeSelect.value;
        
        // Hide all specific UIs
        [craftingUI, brewingUI, smeltingUI].forEach(ui => ui.classList.add('hidden'));

        // Show the correct one
        if (selectedType === 'crafting_table') {
            craftingUI.classList.remove('hidden');
        } else if (selectedType === 'brewing_stand') {
            brewingUI.classList.remove('hidden');
        } else { // Furnace, Smoker, etc.
            smeltingUI.classList.remove('hidden');
            smeltingUI.querySelector('h2').textContent = `${selectedType.replace('_', ' ')} Recipe Details`;
        }
    }

    function switchCraftingType(shaped) {
        isShaped = shaped;
        shapedBtn.classList.toggle('active', isShaped);
        shapelessBtn.classList.toggle('active', !isShaped);
        shapedRecipeUI.classList.toggle('hidden', !isShaped);
        shapelessRecipeUI.classList.toggle('hidden', isShaped);
    }
    
    function updateKeyMappings() {
        const usedSymbols = new Set();
        craftingGridInputs.forEach(input => {
            const symbol = input.value.trim().toUpperCase();
            if (symbol.match(/^[A-Z*#|]$/)) { // Valid symbols
                usedSymbols.add(symbol);
            }
        });

        // Get currently mapped symbols
        const currentMappings = new Map();
        keyMappingArea.querySelectorAll('.key-mapping-item').forEach(item => {
            const symbol = item.dataset.symbol;
            const value = item.querySelector('input').value;
            currentMappings.set(symbol, value);
        });

        keyMappingArea.innerHTML = ''; // Clear current keys

        usedSymbols.forEach(symbol => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'key-mapping-item';
            itemDiv.dataset.symbol = symbol;
            
            const existingValue = currentMappings.get(symbol) || `minecraft:`;
            
            itemDiv.innerHTML = `
                <span class="key-symbol">${symbol} =</span>
                <input type="text" value="${existingValue}" placeholder="minecraft:item_name">
            `;
            keyMappingArea.appendChild(itemDiv);
        });
    }

    function addIngredient() {
        if (ingredientsList.children.length >= 9) return;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'key-mapping-item'; // Re-use style
        itemDiv.innerHTML = `
            <input type="text" placeholder="minecraft:item_name">
            <button class="delete-btn">X</button>
        `;
        itemDiv.querySelector('.delete-btn').addEventListener('click', () => itemDiv.remove());
        ingredientsList.appendChild(itemDiv);
    }

    function addUnlockItem() {
        if (unlockItemsContainer.children.length >= 8) return;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'key-mapping-item'; // Re-use style
        itemDiv.innerHTML = `
            <input type="text" placeholder="minecraft:item_name">
            <button class="delete-btn">X</button>
        `;
        itemDiv.querySelector('.delete-btn').addEventListener('click', () => itemDiv.remove());
        unlockItemsContainer.appendChild(itemDiv);
    }
    
    function toggleSidebar() {
        sidebar.classList.toggle('visible');
        menuButton.textContent = sidebar.classList.contains('visible') ? 'X' : '☰';
    }


    function validateAndBuildRecipe() {
        const recipe = {};
        const errors = [];

        // Common validations
        if (!identifierInput.value.trim()) errors.push("Identifier Name is required.");
        if (!outputItemInput.value.trim()) errors.push("Output Item Name is required.");

        const recipeType = recipeTypeSelect.value;
        const recipeKey = `minecraft:recipe_${recipeType === 'brewing_stand' ? 'brewing_mix' : recipeType === 'crafting_table' ? (isShaped ? 'shaped' : 'shapeless') : recipeType}`;
        
        recipe.format_version = document.getElementById('version-input').value || "1.20.50";
        recipe[recipeKey] = {
            description: { identifier: identifierInput.value.trim() },
            tags: [recipeType],
            result: {
                item: outputItemInput.value.trim(),
                count: parseInt(outputCountInput.value)
            }
        };

        const details = recipe[recipeKey];

        // Type-specific logic
        if (recipeType === 'crafting_table') {
            if (isShaped) {
                // Shaped
                details.pattern = [
                    `${craftingGridInputs[0].value || ' '}${craftingGridInputs[1].value || ' '}${craftingGridInputs[2].value || ' '}`,
                    `${craftingGridInputs[3].value || ' '}${craftingGridInputs[4].value || ' '}${craftingGridInputs[5].value || ' '}`,
                    `${craftingGridInputs[6].value || ' '}${craftingGridInputs[7].value || ' '}${craftingGridInputs[8].value || ' '}`
                ];
                details.key = {};
                keyMappingArea.querySelectorAll('.key-mapping-item').forEach(item => {
                    const symbol = item.dataset.symbol;
                    const itemValue = item.querySelector('input').value.trim();
                    if (itemValue) {
                        details.key[symbol] = { item: itemValue };
                    } else {
                        errors.push(`Symbol '${symbol}' is used in the pattern but not mapped to an item.`);
                    }
                });
                if (Object.keys(details.key).length === 0) errors.push("At least one symbol must be mapped to an item for a shaped recipe.");
            } else {
                // Shapeless
                details.ingredients = [];
                ingredientsList.querySelectorAll('input').forEach(input => {
                    const itemValue = input.value.trim();
                    if (itemValue) {
                        details.ingredients.push({ item: itemValue });
                    }
                });
                if (details.ingredients.length === 0) errors.push("At least one ingredient is required for a shapeless recipe.");
            }
        } else if (recipeType === 'brewing_stand') {
             details.input = document.getElementById('potion-input').value.trim();
             details.reagent = document.getElementById('reagent-input').value.trim();
             details.output = outputItemInput.value.trim();
             delete details.result; // Brewing uses a different output structure
             if (!details.input) errors.push("Input Potion Type is required.");
             if (!details.reagent) errors.push("Reagent Name is required.");
        } else { // Smelting types
            details.input = document.getElementById('smelting-input').value.trim();
            if(!details.input) errors.push("Input Item Name is required.");
        }
        
        // Advanced settings
        const unlockItems = Array.from(unlockItemsContainer.querySelectorAll('input'))
            .map(input => input.value.trim())
            .filter(val => val)
            .map(item => ({ item }));
        
        if (unlockItems.length > 0) {
            details.unlock = unlockItems;
        }

        const priority = priorityInput.value.trim();
        if (priority !== '') {
            details.priority = parseInt(priority);
        }

        if (errors.length > 0) {
            alert("Please fix the following errors:\n\n- " + errors.join("\n- "));
            return null;
        }

        return recipe;
    }


    function processRecipe() {
        const recipeObject = validateAndBuildRecipe();
        if (recipeObject) {
            const jsonString = JSON.stringify(recipeObject, null, 2);
            jsonCode.textContent = jsonString;
            jsonOutputArea.classList.remove('hidden');
            jsonOutputArea.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function copyJson() {
        navigator.clipboard.writeText(jsonCode.textContent).then(() => {
            alert('JSON copied to clipboard!');
        }, () => {
            alert('Failed to copy JSON.');
        });
    }

    function downloadJson() {
        const blob = new Blob([jsonCode.textContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = (identifierInput.value.trim().split(':').pop() || 'recipe') + '.json';
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // --- Initial Setup ---
    updateUIVisibility();
    switchCraftingType(true);
    addIngredient();
    addUnlockItem();

});
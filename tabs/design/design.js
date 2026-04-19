(function() {
    // DOM Elements
    const submitBtn = document.getElementById('btn-submit-design');
    const designContainer = document.getElementById('design-container');
    const btnGeneratePrompt = document.getElementById('btn-generate-prompt');

    // --- Reusable Tooltip Module ---
    // 1. Cleanup: Remove any leftover tooltips from previous script executions
    document.querySelectorAll('.custom-tooltip').forEach(el => el.remove());

    let tooltipElement = null;
    let activeTooltipTarget = null;

    /**
     * Creates the tooltip element and appends it to the body.
     */
    function createTooltipElement() {
        if (tooltipElement) return;
        if (!designContainer) return;
        
        tooltipElement = document.createElement('div');
        tooltipElement.className = 'custom-tooltip';
        
        designContainer.appendChild(tooltipElement);
    }

    /**
     * Hides the currently visible tooltip.
     */
    function hideTooltip() {
        if (!tooltipElement || !tooltipElement.classList.contains('show')) return;

        tooltipElement.classList.remove('show');

        // Restore title to the target element
        if (activeTooltipTarget && activeTooltipTarget.dataset.originalTitle) {
            activeTooltipTarget.setAttribute('title', activeTooltipTarget.dataset.originalTitle);
            delete activeTooltipTarget.dataset.originalTitle;
        }
        activeTooltipTarget = null;
    }

    /**
     * Shows a tooltip with a given text near a target element.
     * @param {HTMLElement} target - The element to position the tooltip near.
     * @param {string} text - The text content for the tooltip.
     */
    function showTooltip(target, text) {
        createTooltipElement();

        // If clicking the same icon that already has an active tooltip, hide it.
        if (target === activeTooltipTarget) {
            hideTooltip();
            return;
        }

        // Hide any previous tooltip before showing a new one
        hideTooltip();

        activeTooltipTarget = target;

        // Prevent native tooltip from showing
        if (target.getAttribute('title')) {
            target.dataset.originalTitle = target.getAttribute('title');
            target.removeAttribute('title');
        }

        tooltipElement.textContent = text;
        tooltipElement.classList.add('show');

        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltipElement.getBoundingClientRect();

        let top = targetRect.bottom + window.scrollY + 8;
        let left = targetRect.left + window.scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);

        // Boundary checks
        if (left < 5) left = 5;
        if (left + tooltipRect.width > window.innerWidth - 5) left = window.innerWidth - tooltipRect.width - 5;

        tooltipElement.style.top = `${top}px`;
        tooltipElement.style.left = `${left}px`;
    }
    
    // Self-cleaning global click listener
    function handleGlobalClick(e) {
        // If the design tab is no longer in the DOM, remove this listener (cleanup)
        if (!document.getElementById('design-container')) {
            document.removeEventListener('click', handleGlobalClick);
            return;
        }

        // Hide tooltip if clicking outside the tooltip AND outside the active icon
        if (tooltipElement && tooltipElement.classList.contains('show')) {
            if (!tooltipElement.contains(e.target) && e.target !== activeTooltipTarget) {
                hideTooltip();
            }
        }
    }

    // SPARQL Queries Configuration
    // Fill these strings with your SPARQL queries.
    // Ensure the query returns a single column with the values you want to list.
    const QUERIES = {
        concepto: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX progreval: <urn:protege:ontology:progreval#>

        SELECT ?Label ?Instance_URI ?Description
        WHERE {
            ?Instance_URI a progreval:Concepto-Fundamental.
            ?Instance_URI rdfs:label ?Label.
            OPTIONAL { ?Instance_URI dc:description ?Description. } 
        }`,
        desempeno: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX progreval: <urn:protege:ontology:progreval#>

        SELECT ?Label ?Instance_URI ?Description
        WHERE {
            ?Instance_URI a progreval:Desempeño.
            ?Instance_URI rdfs:label ?Label.
            OPTIONAL { ?Instance_URI dc:description ?Description. }
        }`,
        publico_objetivo: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX progreval: <urn:protege:ontology:progreval#>

        SELECT ?Label ?Instance_URI ?Description
        WHERE {
            ?Instance_URI a progreval:Publico-Objetivo.
            ?Instance_URI rdfs:label ?Label.
            OPTIONAL { ?Instance_URI dc:description ?Description. }
        }`,
        complejidad: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX progreval: <urn:protege:ontology:progreval#>

        SELECT ?Label ?Instance_URI ?Description ?Order
        WHERE {
            ?Instance_URI a progreval:Nivel-de-Complejidad .
            ?Instance_URI rdfs:label ?Label .
	        ?Instance_URI progreval:orden ?Order .

            OPTIONAL { 
               ?nivel_para_concepto a progreval:Complejidad-por-Concepto. 
	  	       ?nivel_para_concepto progreval:nivel ?Instance_URI.
	  	       ?nivel_para_concepto progreval:concepto {{CONCEPTO_URI}}.
               ?nivel_para_concepto dc:description ?Description.		       
		     }
        }`,
        formato_esfuerzo: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX progreval: <urn:protege:ontology:progreval#>

        SELECT ?Label ?Instance_URI ?Description ?Esfuerzo ?Order
        WHERE {
            ?Instance_URI a progreval:Formato-Consigna.
            ?Instance_URI rdfs:label ?Label.
            OPTIONAL { ?Instance_URI dc:description ?Description. }
            OPTIONAL { ?Instance_URI progreval:conllevaEsfuerzoDeCorreccion ?Esfuerzo_URI.
                       ?Esfuerzo_URI rdfs:label ?Esfuerzo.
                       ?Esfuerzo_URI progreval:orden ?Order.}
        }`,
        actividad: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX progreval: <urn:protege:ontology:progreval#>

        SELECT ?consigna_modelo ?Consigna ?Respuesta
        WHERE {
        
        # Busca las actividades que evalúan el concepto y el desempeño
        ?actividad progreval:evaluaConcepto {{CONCEPTO_URI}} ;
                    progreval:evaluaDesempeño {{DESEMPENO_URI}};
                    progreval:usaFormato {{FORMATO_URI}} .

        # Busca enunciados que sean ejemplos de la actividad
        ?consigna_modelo progreval:esEjemploDe ?actividad .

        # Busca enunciados que cumplan con el público objetivo
        ?consigna_modelo progreval:apuntadaA {{NIVEL_EDUCATIVO_URI}} .

        ?consigna_modelo progreval:evaluaConceptoANivel {{NIVEL_COMPLEJIDAD_URI}} .        

        # Recupera la consigna del enunciado, si existe
        OPTIONAL { ?consigna_modelo progreval:Enunciado ?Consigna . }
        
        # Recupera la respuesta del enunciado, si existe
        OPTIONAL { ?consigna_modelo progreval:Respuesta ?Respuesta . }
        }
        ORDER BY RAND()`,
        class_descriptions: `PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX progreval: <urn:protege:ontology:progreval#>

        SELECT ?Class_URI ?Description
        WHERE {
            ?Class_URI dc:description ?Description .
            
        }`
    };

    /**
     * Executes a SPARQL query and returns the results.
     * @param {string} queryString 
     * @returns {Promise<{results: Array, vars: Array}>}
     */
    const executeSparql = (queryString) => {
        return new Promise((resolve, reject) => {
            if (!queryString || queryString.trim() === '') {
                resolve([]); // Return empty if query is not defined yet
                return;
            }

            // Remove lines starting with # (including the newline) to avoid parsing issues
                queryString = queryString.replace(/^\s*#.*(\r\n|\n|\r)?/gm, '');

            // Extract LIMIT and ORDER BY RAND manually because rdflib.js ignores them
            const limitMatch = queryString.match(/LIMIT\s+(\d+)/i);
            const limit = limitMatch ? parseInt(limitMatch[1], 10) : 0;
            const isRandom = /ORDER\s+BY\s+RAND/i.test(queryString);

            try {
                
                const query = window.$rdf.SPARQLToQuery(queryString, false, window.store);
                const results = [];


                // Execute query
                window.store.query(query, result => {
                    // Callback for each row found
                    results.push(result);
                }, undefined, () => {
                    // Callback when finished
                    let finalResults = results;

                    // Apply manual shuffle if requested
                    if (isRandom) {
                        finalResults.sort(() => Math.random() - 0.5);
                    }

                    // Apply manual limit if requested
                    if (limit > 0 && finalResults.length > limit) {
                        finalResults = finalResults.slice(0, limit);
                    }

                    resolve({ results: finalResults, vars: query.vars });
                });

            } catch (err) {
                reject(err);
            }
        });
    };

    /**
     * Fetches data for a specific key and parses it into a standard format.
     * @param {string} queryKey The key in QUERIES object
     * @param {Object} replacements Optional key-value pairs to replace in the query string
     * @returns {Promise<Array<Object>>}
     */
    const fetchData = async (queryKey, replacements = {}) => {
        try {
            let queryString = QUERIES[queryKey];
            if (!queryString) return [];

            // Apply replacements
            for (const [placeholder, value] of Object.entries(replacements)) {
                queryString = queryString.split(placeholder).join(value);
            }

            // print queryString
            console.log(`Query: \n${queryString}`);
            

            const { results, vars } = await executeSparql(queryString);
            
            return results.map(row => {
                const obj = {};
                vars.forEach(v => {
                    const varName = v.toString();
                    const key = varName.replace(/^\?/, '').toLowerCase();
                    if (row[varName]) obj[key] = row[varName].value;
                });

                //print obj
                console.log(`Result: \n${JSON.stringify(obj, null, 2)}`);

                return obj;
            });
        } catch (err) {
            console.error(`Error loading ${queryKey}:`, err);
            return [];
        }
    };

    /**
     * Populates a <select> element with the provided data.
     * @param {string} selectId
     * @param {Array<{label: string, value: string}>} data 
     */
    const renderSelect = (selectId, data) => {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = '<option value="">Seleccionar...</option>';
        
        if (data.length === 0) {
            const option = document.createElement('option');
            option.text = "No se encontraron datos";
            select.add(option);
            select.disabled = true;
        } else {
            // Sort data if 'order' attribute is present
            if (data.length > 0 && data[0].hasOwnProperty('order')) {
                data.sort((a, b) => parseInt(a.order, 10) - parseInt(b.order, 10));
            }

            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.value;
                option.text = item.label;
                if (item.description) {
                    option.dataset.description = item.description;
                }
                select.appendChild(option);
            });
            select.disabled = false;
        }
    };

    /**
     * Renders the Complejidad options as a list of checkboxes.
     * @param {Array} data 
     */
    const renderComplejidadOptions = (data) => {
        const container = document.getElementById('complejidad-container');
        if (!container) return;

        container.innerHTML = '';

        if (data.length === 0) {
            container.innerHTML = '<div class="status-message">No se encontraron niveles de complejidad.</div>';
            return;
        }

        // Sort by order
        if (data.length > 0 && data[0].hasOwnProperty('order')) {
            data.sort((a, b) => parseInt(a.order, 10) - parseInt(b.order, 10));
        }

        let html = '';
        data.forEach(item => {
            html += `<label class="complejidad-option">
                <div class="complejidad-header">
                    <input type="radio" name="complejidad_option" value="${item.value}" style="margin-right: 8px;">
                    ${item.label}
                </div>
                <div class="complejidad-body">${item.description || ''}</div>
            </label>`;
        });
        container.innerHTML = html;

        // Event delegation for validation and styling
        container.onchange = (e) => {
            if (e.target.name === 'complejidad_option') {
                // Remove 'selected' class from all options
                container.querySelectorAll('.complejidad-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                // Add 'selected' class to the parent label of the checked radio
                if (e.target.checked) {
                    e.target.closest('.complejidad-option').classList.add('selected');
                }
                checkFormValidity();
            }
        };
    };

    /**
     * Builds the "Conocimientos previos" grid.
     * @param {Array<{label: string, instance_uri: string, description: string}>} conceptos
     * @param {Array<{label: string, instance_uri: string, description: string}>} desempenos
     */
    const renderGrid = (conceptos, desempenos) => {
        const container = document.getElementById('knowledge-grid-container');
        if (!container) return;

        if (conceptos.length === 0 || desempenos.length === 0) {
            container.innerHTML = '<p>No hay datos suficientes para generar la tabla.</p>';
            return;
        }

        const PROGREVAL = window.$rdf.Namespace('urn:protege:ontology:progreval#');

        let html = '<table class="design-grid"><thead><tr><th><div class="grid-center-cell"><input type="checkbox" id="select-all-grid" title="Seleccionar todo"></div></th>';
        
        // Header Row (Conceptos)
        conceptos.forEach((c, index) => {
            html += `<th>
                <div class="header-content">
                    <div class="header-label-container">
                        <div class="header-label">${c.label}</div>
                        <div title="${c.description.replace(/"/g, '&quot;')}" class="info-icon">ℹ️</div>                    
                    </div>
                    <input type="checkbox" class="select-all-col" data-col="${index}" title="Seleccionar todo">
                </div>
            </th>`;
        });
        html += '</tr></thead><tbody>';

        // Body Rows (Desempeños)
        desempenos.forEach(d => {
            html += `<tr><th>
                <div class="header-label-container">
                    <div class="header-label">${d.label}</div>
                    <div title="${d.description ? d.description.replace(/"/g, '&quot;') : ''}" class="info-icon">ℹ️</div>
                </div>
            </th>`;
            conceptos.forEach((c, index) => {
                const dNode = window.$rdf.sym(d.instance_uri);
                const cNode = window.$rdf.sym(c.instance_uri);
                
                const skillsWithDesempeno = window.store.match(null, PROGREVAL('empleaDesempeño'), dNode);
                let skillUri = null;

                for (const st of skillsWithDesempeno) {
                    const skillSubject = st.subject;
                    const hasConcept = window.store.match(skillSubject, PROGREVAL('empleaDesempeñoSobre'), cNode);
                    if (hasConcept.length > 0) {
                        skillUri = skillSubject.value;
                        break;
                    }
                }

                html += `<td><input type="checkbox" name="conocimiento_previo" value="${skillUri || ''}" data-col="${index}" ${!skillUri ? 'disabled' : ''}></td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;

        container.onchange = (e) => {
            if (e.target.id === 'select-all-grid') {
                const isChecked = e.target.checked;
                const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(cb => {
                    if (cb !== e.target && !cb.disabled) {
                        cb.checked = isChecked;
                    }
                });
            } else if (e.target.classList.contains('select-all-col')) {
                const colIndex = e.target.dataset.col;
                const isChecked = e.target.checked;
                const checkboxes = container.querySelectorAll(`input[name="conocimiento_previo"][data-col="${colIndex}"]`);
                checkboxes.forEach(cb => cb.checked = isChecked);
            } else if (e.target.name === 'conocimiento_previo') {
                const colIndex = e.target.dataset.col;
                const selectAllCb = container.querySelector(`.select-all-col[data-col="${colIndex}"]`);
                const colCheckboxes = container.querySelectorAll(`input[name="conocimiento_previo"][data-col="${colIndex}"]`);
                
                if (selectAllCb) {
                    selectAllCb.checked = Array.from(colCheckboxes).every(cb => cb.checked);
                }
            }
        };
    };

    const renderResults = (results) => {
        const resultsDiv = document.getElementById('design-results');
        const btnGeneratePrompt = document.getElementById('btn-generate-prompt');
        if (!resultsDiv) return;

        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="status">No se encontraron resultados.</div>';
            btnGeneratePrompt.disabled = true;
            return;
        }

        btnGeneratePrompt.disabled = false; 

        // Determine headers from the first result object
        const headers = Object.keys(results[0]);

        let html = '';

        results.forEach((row, index) => {
            html += `<div class="result-row">`;
            html += `<button type="button" class="btn-copy-example" title="Copiar ejemplo">Copiar</button>`;
            html += `<h3 class="row-header">Ejemplo ${index + 1}</h3>`;
            
            headers.forEach(h => {
                const val = row[h];
                let display = '';
                if (val) {
                    // Heuristic to detect URIs since we lost termType
                    if (val.startsWith('http') || val.startsWith('urn:')) {
                        const label = val.split('#').pop() || val;
                        display = `<a href="${val}" title="${val}" target="_blank">${label}</a>`;
                    } else {
                        // Escape HTML characters for security
                        display = val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
                    }
                }
                const label = h.charAt(0).toUpperCase() + h.slice(1);
                html += `<div class="data-pair">`;
                html += `<span class="data-label">${label}:</span>`;
                html += `<div class="data-value">${display}</div>`;
                html += `</div>`;
            });
            html += `</div>`;
        });

        resultsDiv.innerHTML = html;
    };

    /**
     * Renders the Esfuerzo glossary.
     * @param {Array<{label: string, order: string}>} effortData
     */
    const renderEsfuerzoGlossary = (effortData) => {
        const container = document.getElementById('esfuerzo-glossary');
        if (!container) return;

        // Sort by order
        effortData.sort((a, b) => parseInt(a.order, 10) - parseInt(b.order, 10));

        if (effortData.length === 0) {
            container.innerHTML = '<div class="status-message">No se encontraron datos.</div>';
            return;
        }

        container.innerHTML = effortData.map(item =>
            `<div class="glossary-item"><span class="glossary-term">${item.order}:</span> ${item.label}</div>`
        ).join('');
    };


    const checkFormValidity = () => {
        const requiredIds = ['select-concepto', 'select-desempeno', 'select-publico', 'select-formato'];
        let allFilled = requiredIds.every(id => {
            const el = document.getElementById(id);
            return el && el.value !== "";
        });

        if (allFilled) {
            const checkedComplejidad = document.querySelector('input[name="complejidad_option"]:checked');
            if (!checkedComplejidad) {
                allFilled = false;
            }
        }

        if (submitBtn) {
            submitBtn.disabled = !allFilled;
            const note = document.getElementById('submit-disabled-note');
            if (note) {
                note.style.display = allFilled ? 'none' : 'inline';
            }
        }
    };

    const setupDescriptionListener = (selectId, descriptionId) => {
        const select = document.getElementById(selectId);
        const descContainer = document.getElementById(descriptionId);
        if (select && descContainer) {
            select.addEventListener('change', (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const desc = selectedOption ? selectedOption.dataset.description : '';
                descContainer.textContent = desc || '';
                descContainer.style.display = desc ? 'block' : 'none';
            });
        }
    };

    const init = async () => {
        // --- Initialize Tooltip Listeners ---
        if (designContainer) {
            // Use event delegation for all info icons within the design tab
            designContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('info-icon')) {
                    const description = e.target.getAttribute('title') || e.target.dataset.originalTitle;
                    if (description) {
                        showTooltip(e.target, description);
                    }
                    e.stopPropagation(); // Prevent the document click listener from hiding it immediately
                }
            });
        }
        // Global listener to hide tooltip when clicking elsewhere
        document.addEventListener('click', handleGlobalClick);
        // --- End Tooltip Listeners ---

        // Fetch all data first
        const [conceptos, desempenos, publicos, formatos, classDescriptions] = await Promise.all([
            fetchData('concepto'),
            fetchData('desempeno'),
            fetchData('publico_objetivo'),
            fetchData('formato_esfuerzo'),
            fetchData('class_descriptions')
        ]);

        // Assign instance_uri attribute value to a value attribute to match renderSelect contract
        conceptos.forEach(c => c.value = c.instance_uri);
        desempenos.forEach(d => d.value = d.instance_uri);
        publicos.forEach(p => p.value = p.instance_uri);
        formatos.forEach(f => f.value = f.instance_uri);
        


        // Render Dropdowns
        renderSelect('select-concepto', conceptos);
        renderSelect('select-desempeno', desempenos);
        renderSelect('select-publico', publicos);

        // Render Class Tooltips (Descriptions)
        const classLabelMap = {
            'Publico-Objetivo': 'select-publico',
            'Concepto-Fundamental': 'select-concepto',
            'Desempeño': 'select-desempeno',
            'Formato-Actividad': 'select-formato',
            'Nivel-de-Complejidad': 'complejidad-container' // Special case: find label relative to container
        };

        classDescriptions.forEach(item => {
            // item.class_uri will look like "...#Publico-Objetivo"
            const className = item.class_uri.split('#').pop();
            const targetId = classLabelMap[className];
            
            if (targetId) {
                let labelEl;
                if (className === 'Nivel-de-Complejidad') {
                    // This label doesn't have a 'for' attribute, find it via the container
                    const container = document.getElementById(targetId);
                    if (container && container.parentElement) {
                        labelEl = container.parentElement.querySelector('label');
                    }
                } else {
                    labelEl = document.querySelector(`label[for="${targetId}"]`);
                }

                // Check if an info-icon does NOT already exist as the next sibling
                if (labelEl && !labelEl.nextElementSibling?.classList.contains('info-icon')) {
                    const icon = document.createElement('span');
                    icon.className = 'info-icon';
                    icon.textContent = 'ℹ️';
                    // The global tooltip listener uses the title attribute
                    icon.title = item.description; 
                    labelEl.after(icon); // Place icon after the label, not inside it
                }
            }
        });

        // Logic for Esfuerzo/Formato
        const formatoSelect = document.getElementById('select-formato');

        if (formatoSelect) {
            // 1. Prepare and render Esfuerzo Glossary
            const effortGlossaryData = [...new Map(formatos.map(i => {
                const item = { label: i.esfuerzo, order: i.order };
                return [`${item.value}|${item.order}`, item];
            })).values()].filter(i => i.label && i.order);
            renderEsfuerzoGlossary(effortGlossaryData);

            // 2. Prepare and render Formato dropdown
            // Sort by effort order, then by label
            formatos.sort((a, b) => {
                const orderA = parseInt(a.order, 10);
                const orderB = parseInt(b.order, 10);
                if (orderA !== orderB) return orderA - orderB;
                return a.label.localeCompare(b.label);
            });

            // Modify labels to include effort
            formatos.forEach(f => {
                if (f.label && f.order) {
                    f.label = `${f.label} (Esfuerzo: ${f.order})`;
                }
            });

            renderSelect('select-formato', formatos);
        }

        // Render Grid
        renderGrid(conceptos, desempenos);

        // Add event listener for Concepto -> Complejidad
        const conceptoSelect = document.getElementById('select-concepto');
        if (conceptoSelect) {
            conceptoSelect.addEventListener('change', async (e) => {
                const val = e.target.value;
                const compContainer = document.getElementById('complejidad-container');

                if (!compContainer) return;

                if (!val) {
                    compContainer.innerHTML = '<div class="status-message">Seleccione un concepto primero</div>';
                    checkFormValidity();
                    return;
                }

                compContainer.innerHTML = '<div class="status-message">Cargando...</div>';

                // Construct URI (assuming standard namespace pattern)
                const uri = `<${val}>`;
                
                const data = await fetchData('complejidad', { '{{CONCEPTO_URI}}': uri });
                data.forEach(d => d.value = d.instance_uri);
                renderComplejidadOptions(data);
                checkFormValidity();
            });
        }

        // Setup description listeners
        setupDescriptionListener('select-concepto', 'concepto-description');
        setupDescriptionListener('select-desempeno', 'desempeno-description');
        setupDescriptionListener('select-formato', 'formato-description');

        // Attach validation listeners to all required selects
        ['select-desempeno', 'select-publico', 'select-formato'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', checkFormValidity);
        });

        // Initial check
        checkFormValidity();
    };

    // Check if ontology is loaded
    if (window.isOntologyLoaded) {
        init();
    } else {
        window.addEventListener('ontologyLoaded', init, { once: true });
    }

    // Submit action
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const getSelectedValue = (id) => {
                const el = document.getElementById(id);
                return el && el.value ? `<${el.value}>` : '';
            };

            // Collect unchecked skills (skills the user does NOT have)
            const unchecked = document.querySelectorAll('input[name="conocimiento_previo"]:not(:checked)');
            const forbiddenSkillURIs = new Set();
            
            unchecked.forEach(cb => {
                if (cb.value) {
                    forbiddenSkillURIs.add(cb.value);
                }
            });
            
            // Get Complejidad value
            const checkedComplejidad = document.querySelector('input[name="complejidad_option"]:checked');
            const complejidadReplacement = checkedComplejidad ? `<${checkedComplejidad.value}>` : '';

            const replacements = {
                '{{CONCEPTO_URI}}': getSelectedValue('select-concepto'),
                '{{NIVEL_COMPLEJIDAD_URI}}': complejidadReplacement,
                '{{DESEMPENO_URI}}': getSelectedValue('select-desempeno'),
                '{{NIVEL_EDUCATIVO_URI}}': getSelectedValue('select-publico'),
                '{{FORMATO_URI}}': getSelectedValue('select-formato')
            };
            
            let results = await fetchData('actividad', replacements);
            
            // Filter results in JS to avoid SPARQL engine limitations
            const PROGREVAL = window.$rdf.Namespace('urn:protege:ontology:progreval#');
            
            if (forbiddenSkillURIs.size > 0) {
                results = results.filter(row => {
                    const enunciadoUri = row.consigna_modelo;
                    if (!enunciadoUri) return false;
                    
                    const enunciadoNode = window.$rdf.sym(enunciadoUri);
                    const skills = window.store.match(enunciadoNode, PROGREVAL('requiereManejoDe'), null);
                    
                    for (const st of skills) {
                        if (forbiddenSkillURIs.has(st.object.value)) {
                            return false;
                        }
                    }
                    return true;
                });
            }

            // Apply limit manually after filtering
            results = results.slice(0, 1);

            // Delete the consigna_modelo column from results so it's not rendered
            results.forEach(row => {
                delete row.consigna_modelo;
            });
            

            renderResults(results);
        });
    }

    // --- Prompt Popup Logic ---
    const promptPopup = document.getElementById('prompt-popup');
    const btnClosePopup = document.getElementById('popup-close-btn');
    const btnCopyPrompt = document.getElementById('btn-copy-prompt');
    const promptText = document.getElementById('prompt-text');

    /**
     * Generates an AI prompt based on the current form selections.
     * This is a placeholder; the full logic will be provided later.
     * @returns {string} The generated prompt text.
     */
    const generateAIPrompt = async () => {

        // Fetch all data first
        const [conceptos, desempenos, formatos] = await Promise.all([
            fetchData('concepto'),
            fetchData('desempeno'),
            fetchData('formato_esfuerzo')
        ]);

        const getSelectedText = (id) => {
            const el = document.getElementById(id);
            if (!el || el.selectedIndex <= 0) return 'N/A';
            // Clean up the label text which now includes effort
            return el.options[el.selectedIndex].text.split(' (Esfuerzo:')[0];
        };

        const getCheckedLabel = (name) => {
            const checked = document.querySelector(`input[name="${name}"]:checked`);
            if (!checked) return 'N/A';
            // Clone the node to avoid modifying the DOM, then remove the input to get clean text
            const headerClone = checked.closest('.complejidad-option').querySelector('.complejidad-header').cloneNode(true);
            headerClone.querySelector('input').remove();
            return headerClone.textContent.trim();
        };

        const publico = getSelectedText('select-publico');
        const concepto = getSelectedText('select-concepto');
        const complejidad = getCheckedLabel('complejidad_option');
        const desempeno = getSelectedText('select-desempeno');
        const formato = getSelectedText('select-formato');

        const getDesc = (list, suffix) => list.find(item => item.instance_uri.split('#').pop() === suffix)?.description || 'N/A';

        const definicion_directiva_repeticion = getDesc(conceptos, 'Directiva-de-Repeticion');
        const definicion_directiva_seleccion = getDesc(conceptos, 'Directiva-de-Seleccion');
        const definicion_expresion_logica = getDesc(conceptos, 'Expresion-Logica');
        const definicion_expresion_matematica = getDesc(conceptos, 'Expresion-Matematica');
        const definicion_funcion = getDesc(conceptos, 'Funcion');
        const definicion_tipo_dato_primitivo = getDesc(conceptos, 'Tipo-de-Dato-Primitivo');
        const definicion_tipo_dato_estructurado = getDesc(conceptos, 'Tipo-de-Dato-Estructurado');
        const definicion_variable = getDesc(conceptos, 'Variable');
        const definicion_definicion = getDesc(desempenos, 'Definicion');
        const definicion_depuracion = getDesc(desempenos, 'Depuracion');
        const definicion_especificacion = getDesc(desempenos, 'Especificacion');
        const definicion_esquematizacion = getDesc(desempenos, 'Esquematizacion');
        const definicion_evaluacion = getDesc(desempenos, 'Evaluacion');
        const definicion_explicacion = getDesc(desempenos, 'Explicacion');
        const definicion_implementacion = getDesc(desempenos, 'Implementacion');
        const definicion_modificacion = getDesc(desempenos, 'Modificacion');
        const definicion_seguimiento = getDesc(desempenos, 'Seguimiento');

        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        const getComplejidadDesc = (term) => {
            const options = Array.from(document.querySelectorAll('#complejidad-container .complejidad-option'));
            const found = options.find(opt => opt.querySelector('.complejidad-header')?.textContent.toLowerCase().includes(term.toLowerCase()));
            return found ? found.querySelector('.complejidad-body')?.textContent.trim() || 'N/A' : 'N/A';
        };

        const nivel_basico_concepto = getComplejidadDesc('Básico');
        const nivel_intermedio_concepto = getComplejidadDesc('Intermedio');
        const nivel_avanzado_concepto = getComplejidadDesc('Avanzado');

        const definicion_actividad_seleccionada = getDesc(formatos, getVal('select-formato').split('#').pop());
        
        // Retrieve generated examples from the results section
        let ejemplos = 'N/A';
        const resultsContainer = document.getElementById('design-results');
        if (resultsContainer && resultsContainer.querySelectorAll('.result-row').length > 0) {
            ejemplos = Array.from(resultsContainer.querySelectorAll('.result-row')).map((row, i) => {
                const content = Array.from(row.querySelectorAll('.data-pair')).map(pair => {
                    return `${pair.querySelector('.data-label').textContent} \n \`\`\` \n ${pair.querySelector('.data-value').textContent} \n \`\`\` \n`;
                }).join('\n');
                return `### Ejemplo ${i+1}:\n${content}`;
            }).join('\n\n');
        }        
         
        const contexto_adicional = getVal('input-additional-info');
        const buenas_practicas = getVal('input-best-practices');
        const objetivos_aprendizaje = null; // getVal('input-learning-objectives');
        
        const formato_salida = 'Markdown';
        const lenguaje_progamacion = getVal('input-language');
        const caracteristicas_vetadas_del_lenguaje = getVal('input-forbidden-features');
        
        const conocimientos_previos = Array.from(document.querySelectorAll('input[name="conocimiento_previo"]:checked')).map(cb => {
            const colIndex = cb.dataset.col;
            const gridHeader = document.querySelectorAll('#knowledge-grid-container thead th')[parseInt(colIndex) + 1];
            const conceptoLabel = gridHeader ? gridHeader.querySelector('.header-label').textContent : '';
            const rowHeader = cb.closest('tr').querySelector('th .header-label');
            const desempenoLabel = rowHeader ? rowHeader.textContent : '';
            return `(${conceptoLabel})-(${desempenoLabel})`;
        }).join(', ') || 'Ninguno';
        

        return `# Identidad
Sos un profesor de programación de ${publico} especializado en el diseño de evaluaciones. Tu trabajo es generar consignas enfocadas en la evaluación de un concepto y un desempeño específicos de programación. El propósito de cada consigna es obtener evidencias de aprendizaje de los estudiantes respecto a lo evaluado. Para esto, las consignas deben proponer situaciones en las que los estudiantes se enfrenten a un determinado nivel de complejidad para el concepto y el desempeño de programación indicados.

# Terminologia
## Conceptos:
-Directiva de Repetición: ${definicion_directiva_repeticion}
-Directiva de Selección: ${definicion_directiva_seleccion}
-Expresión Lógica: ${definicion_expresion_logica}
-Expresión Matemática: ${definicion_expresion_matematica}
-Función: ${definicion_funcion}
-Tipo de Dato Primitivo: ${definicion_tipo_dato_primitivo}
-Tipo de Dato Estructurado: ${definicion_tipo_dato_estructurado}
-Variable: ${definicion_variable}

## Desempeños:
-Definición: ${definicion_definicion}
-Depuración: ${definicion_depuracion}
-Especificación: ${definicion_especificacion}
-Esquematización: ${definicion_esquematizacion}
-Evaluación: ${definicion_evaluacion}
-Explicación: ${definicion_explicacion}
-Implementación: ${definicion_implementacion}
-Modificación: ${definicion_modificacion}
-Seguimiento: ${definicion_seguimiento}

## Conocimientos previos: conjunto de conocimientos ya adquiridos por los estudiantes previo a la tarea actual. Se detallará como un conjunto de pares (Concepto)-(Desempeño).

## Niveles de complejidad para el concepto a evaluar
1. Básico: ${nivel_basico_concepto}
2. Intermedio: ${nivel_intermedio_concepto}
3. Avanzado: ${nivel_avanzado_concepto}

## Formato de Actividad
${formato}: ${definicion_actividad_seleccionada}


# Tarea
Generar una consigna para evaluar ${concepto} donde los estudiantes pongan en juego el desempeño ${desempeno}. Además, deberás elaborar una solución posible explicando paso a paso cómo se obtuvo.

## Requisitos de la consigna
La consigna debe:
- Evaluar el concepto: ${concepto}
- Cumplir con un nivel de complejidad: ${complejidad}. La consigna puede poner en juego niveles de complejidad inferiores pero no debe involucrar niveles superiores.
- Utilizar el formato de actividad: ${formato}
- Promover desempeños de programación asociados a: ${desempeno}
- Considerar que los estudiantes poseen los siguientes conocimientos previos: ${conocimientos_previos} ${(!lenguaje_progamacion || lenguaje_progamacion.trim() === '') ? '' : `\n - Utilizar el lenguaje de programación: ${lenguaje_progamacion}. ${(!caracteristicas_vetadas_del_lenguaje || caracteristicas_vetadas_del_lenguaje.trim() === '') ? '' : 'No deben utilizarse las siguientes características del lenguaje: ' + caracteristicas_vetadas_del_lenguaje}`}
- Evitar anticipar cuál es el concepto que se debe utilizar para resolver la consigna y cómo se espera que sea empleado.
- Especificar un dominio concreto en el que se basa.

## Ejemplos
Los siguientes ejemplos muestran consignas de evaluación y una posible solución escrita en pseudocódigo.

Utilizá los ejemplos como referencia para: 
- Definir la estructura de la consigna y el nivel de detalle esperado. 
- Generar una consigna para ser resuelta con el lenguaje de programación especificado. No utilices instrucciones que no están definidas en el lenguaje.

${ejemplos}

# Formato de salida
Deberás generar la salida en formato ${formato_salida}, sin ningún tipo de información adicional como título, textos introductorios, preguntas, el formato de actividad utilizado.

${(!contexto_adicional || contexto_adicional.trim() === '') ? '' : `# Información adicional${contexto_adicional}`} ${(!buenas_practicas || buenas_practicas.trim() === '') ? '' : `\n ## Buenas Prácticas a contemplar en la solución \n ${buenas_practicas}`} ${(!objetivos_aprendizaje || objetivos_aprendizaje.trim() === '') ? '' : `\n ## Objetivos de aprendizaje \n ${objetivos_aprendizaje}`}
`

};

    if (btnGeneratePrompt && promptPopup && btnClosePopup && btnCopyPrompt && promptText) {
        btnGeneratePrompt.addEventListener('click', async () => {
            promptPopup.style.display = 'flex';
            promptText.value = 'Generando prompt...';
            try {
                promptText.value = await generateAIPrompt();
            } catch (err) {
                console.error(err);
                promptText.value = 'Error al generar el prompt.';
            }
        });

        const closePopup = () => { promptPopup.style.display = 'none'; };
        btnClosePopup.addEventListener('click', closePopup);

        btnCopyPrompt.addEventListener('click', () => {
            navigator.clipboard.writeText(promptText.value).then(() => {
                const originalText = btnCopyPrompt.textContent;
                btnCopyPrompt.textContent = '¡Copiado!';
                btnCopyPrompt.disabled = true;
                setTimeout(() => {
                    btnCopyPrompt.textContent = originalText;
                    btnCopyPrompt.disabled = false;
                }, 2000);
            });
        });
    }

    // --- Example Copy Logic (Event Delegation) ---
    const resultsDiv = document.getElementById('design-results');
    if (resultsDiv) {
        resultsDiv.addEventListener('click', e => {
            if (e.target.classList.contains('btn-copy-example')) {
                const resultRow = e.target.closest('.result-row');
                if (!resultRow) return;

                let textToCopy = Array.from(resultRow.querySelectorAll('.data-pair'))
                    .map(pair => {
                        const label = pair.querySelector('.data-label').textContent;
                        const value = pair.querySelector('.data-value').textContent;
                        return `${label} ${value}`;
                    })
                    .join('\n\n');

                navigator.clipboard.writeText(textToCopy.trim()).then(() => {
                    e.target.textContent = 'Copiado!';
                    setTimeout(() => { e.target.textContent = 'Copiar'; }, 2000);
                });
            }
        });
    }
})();
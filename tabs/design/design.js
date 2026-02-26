(function() {
    // DOM Elements
    const submitBtn = document.getElementById('btn-submit-design');
    const designContainer = document.getElementById('design-container');

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
        competencia: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX progreval: <urn:protege:ontology:progreval#>

        SELECT ?Label ?Instance_URI ?Description ?Order
        WHERE {
            ?Instance_URI a progreval:Nivel-de-Competencia .
            ?Instance_URI rdfs:label ?Label .
	        ?Instance_URI progreval:orden ?Order .

            OPTIONAL { 
               ?nivel_para_concepto a progreval:Competencia-por-Concepto. 
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
            ?Instance_URI a progreval:Formato-Actividad.
            ?Instance_URI rdfs:label ?Label.
            OPTIONAL { ?Instance_URI dc:description ?Description. }
            OPTIONAL { ?Instance_URI progreval:conllevaEsfuerzoDeCorreccion ?Esfuerzo_URI.
                       ?Esfuerzo_URI rdfs:label ?Esfuerzo.
                       ?Esfuerzo_URI progreval:orden ?Order.}
        }`,
        actividad: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX progreval: <urn:protege:ontology:progreval#>

        SELECT ?enunciado_modelo ?Contexto ?Dominio ?Consigna ?Respuesta
        WHERE {
        
        # Busca las actividades que evalúan el concepto y el desempeño
        ?actividad progreval:evalua {{CONCEPTO_URI}} ;
                    progreval:evalua {{DESEMPENO_URI}};
                    progreval:usaFormato {{FORMATO_URI}} .

        # Busca enunciados que sean ejemplos de la actividad
        ?enunciado_modelo progreval:esEjemploDe ?actividad .

        # Busca enunciados que cumplan con el público objetivo
        ?enunciado_modelo progreval:apuntadoA {{NIVEL_EDUCATIVO_URI}} .

        ?enunciado_modelo progreval:evaluaConceptoANivel {{NIVEL_COMPETENCIA_URI}} .        

        # Recupera el contexto del enunciado, si existe
        OPTIONAL { ?enunciado_modelo progreval:Enunciado ?Consigna . }
        
        # Recupera el dominio del enunciado, si existe
        OPTIONAL { ?enunciado_modelo progreval:Respuesta-Posible ?Respuesta . }

        # Recupera la consigna del enunciado, si existe
        OPTIONAL { ?enunciado_modelo progreval:Enunciado ?Consigna . }
        
        # Recupera la respuesta del enunciado, si existe
        OPTIONAL { ?enunciado_modelo progreval:Respuesta ?Respuesta . }
        }
        ORDER BY RAND()`
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
     * Renders the Competencia options as a list of checkboxes.
     * @param {Array} data 
     */
    const renderCompetenciaOptions = (data) => {
        const container = document.getElementById('competencia-container');
        if (!container) return;

        container.innerHTML = '';

        if (data.length === 0) {
            container.innerHTML = '<div class="status-message">No se encontraron niveles de competencia.</div>';
            return;
        }

        // Sort by order
        if (data.length > 0 && data[0].hasOwnProperty('order')) {
            data.sort((a, b) => parseInt(a.order, 10) - parseInt(b.order, 10));
        }

        let html = '';
        data.forEach(item => {
            html += `<label class="competencia-option">
                <div class="competencia-header">
                    <input type="radio" name="competencia_option" value="${item.value}" style="margin-right: 8px;">
                    ${item.label}
                </div>
                <div class="competencia-body">${item.description || ''}</div>
            </label>`;
        });
        container.innerHTML = html;

        // Event delegation for validation and styling
        container.onchange = (e) => {
            if (e.target.name === 'competencia_option') {
                // Remove 'selected' class from all options
                container.querySelectorAll('.competencia-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                // Add 'selected' class to the parent label of the checked radio
                if (e.target.checked) {
                    e.target.closest('.competencia-option').classList.add('selected');
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
        if (!resultsDiv) return;

        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="status">No se encontraron resultados.</div>';
            return;
        }

        // Determine headers from the first result object
        const headers = Object.keys(results[0]);

        let html = '';

        results.forEach((row, index) => {
            html += `<div class="result-row">`;
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

    const checkFormValidity = () => {
        const requiredIds = ['select-concepto', 'select-desempeno', 'select-publico', 'select-formato'];
        let allFilled = requiredIds.every(id => {
            const el = document.getElementById(id);
            return el && el.value !== "";
        });

        if (allFilled) {
            const checkedCompetencia = document.querySelector('input[name="competencia_option"]:checked');
            if (!checkedCompetencia) {
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
        const [conceptos, desempenos, publicos, formatos] = await Promise.all([
            fetchData('concepto'),
            fetchData('desempeno'),
            fetchData('publico_objetivo'),
            fetchData('formato_esfuerzo')
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

        // Logic for Esfuerzo/Formato
        const esfuerzoSelect = document.getElementById('select-esfuerzo');
        const formatoSelect = document.getElementById('select-formato');

        if (esfuerzoSelect && formatoSelect) {
            // Extract unique efforts
            const effortOptions = [...new Map(formatos.map(i => {
                const item = { label: i.esfuerzo, value: i.esfuerzo, order: i.order };
                return [`${item.value}|${item.order}`, item];
            })).values()];
            
            renderSelect('select-esfuerzo', effortOptions);

            esfuerzoSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                
                // Clear formato description when effort changes
                const formatoDesc = document.getElementById('formato-description');
                if (formatoDesc) {
                    formatoDesc.style.display = 'none';
                    formatoDesc.textContent = '';
                }

                if (!val) {
                    formatoSelect.disabled = true;
                    formatoSelect.innerHTML = '<option value="">Seleccione un esfuerzo primero</option>';
                    checkFormValidity();
                    return;
                }
                
                const filtered = formatos.filter(item => item.esfuerzo === val);
                renderSelect('select-formato', filtered);
                checkFormValidity();
            });
        }

        // Render Grid
        renderGrid(conceptos, desempenos);

        // Add event listener for Concepto -> Competencia
        const conceptoSelect = document.getElementById('select-concepto');
        if (conceptoSelect) {
            conceptoSelect.addEventListener('change', async (e) => {
                const val = e.target.value;
                const compContainer = document.getElementById('competencia-container');

                if (!compContainer) return;

                if (!val) {
                    compContainer.innerHTML = '<div class="status-message">Seleccione un concepto primero</div>';
                    checkFormValidity();
                    return;
                }

                compContainer.innerHTML = '<div class="status-message">Cargando...</div>';

                // Construct URI (assuming standard namespace pattern)
                const uri = `<${val}>`;
                
                const data = await fetchData('competencia', { '{{CONCEPTO_URI}}': uri });
                data.forEach(d => d.value = d.instance_uri);
                renderCompetenciaOptions(data);
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
            
            // Get Competencia value
            const checkedCompetencia = document.querySelector('input[name="competencia_option"]:checked');
            const competenciaReplacement = checkedCompetencia ? `<${checkedCompetencia.value}>` : '';

            const replacements = {
                '{{CONCEPTO_URI}}': getSelectedValue('select-concepto'),
                '{{NIVEL_COMPETENCIA_URI}}': competenciaReplacement,
                '{{DESEMPENO_URI}}': getSelectedValue('select-desempeno'),
                '{{NIVEL_EDUCATIVO_URI}}': getSelectedValue('select-publico'),
                '{{FORMATO_URI}}': getSelectedValue('select-formato')
            };
            
            let results = await fetchData('actividad', replacements);
            
            // Filter results in JS to avoid SPARQL engine limitations
            const PROGREVAL = window.$rdf.Namespace('urn:protege:ontology:progreval#');
            
            if (forbiddenSkillURIs.size > 0) {
                results = results.filter(row => {
                    const enunciadoUri = row.enunciado_modelo;
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
            results = results.slice(0, 3);

            // Delete the enunciado_modelo column from results so it's not rendered
            results.forEach(row => {
                delete row.enunciado_modelo;
            });
            

            renderResults(results);
        });
    }
})();
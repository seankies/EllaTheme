var base_url = window.routes.root + '/collections/all-items';

function constructUrlParamsFromSelectedSelects(selectElements) {
    var urlParams = [];

    selectElements.forEach(function(selectElement) {
        var selectedOption = selectElement.selectedOptions[0];
        var paramName = selectedOption.getAttribute('data-param_name');
        var selectedValue = selectedOption.getAttribute('data-value').trim();
        
        if (paramName && selectedValue) {
            urlParams.push(paramName + '=' + selectedValue);
        }
    });

    return urlParams.join('&');
}

function populateOptionsForSelect(filter, selectElement) {
    selectElement.innerHTML = '';
    var defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select ' + filter.label;
    selectElement.appendChild(defaultOption);
    filter.filter_values.forEach(function(value) {
        if (value.count > 0) {
            var option = document.createElement('option');
            option.value = value.value;
            option.textContent = value.label;
            option.setAttribute('data-url-to-add', value.url_to_add);
            option.setAttribute('data-param_name', value.param_name);
            option.setAttribute('data-value', value.value.replace(" ", '+'));
            selectElement.appendChild(option);
        }
    });
}
function updateDisabledSelects(jsonData) {
    var data = JSON.parse(jsonData);
    var selectsToUpdate = document.querySelectorAll('#data-search .select__select[disabled]');
    
    selectsToUpdate.forEach(function(selectElement) {
        var selectId = selectElement.id;
        var filter = data.results.find(filter => selectId === 'select-' + filter.label.replace(/\s+/g, '-').toLowerCase());
        if (filter) {
            populateOptionsForSelect(filter, selectElement);
        }
    });
}
function handleFilterChange(event) {
    var selectedOption = event.target.selectedOptions[0];
    var selectElement = event.target;
    var paramName = selectedOption.getAttribute('data-param_name');
    var selectedValue = selectedOption.value;

    if (paramName && selectedValue) {
        // Get all selected select elements
        var selectedSelects = Array.from(document.querySelectorAll('#data-search .select__select'))
            .filter(select => select.value !== '');

        // Construct URL parameters from selected selects
        var allUrlParams = constructUrlParamsFromSelectedSelects(selectedSelects);

        // Specify the view template parameter for the fetch request
        var viewParam = 'DO-Not-Use';

        // Construct the URL for the fetch request
        var fetchUrl = base_url + '?' + allUrlParams + '&view=' + viewParam;
        console.log(fetchUrl);
        // Fetch the data based on the URL parameters
        fetch(fetchUrl)
            .then(response => response.text())
            .then(data => {
                var newData = JSON.parse(data);
                 updateDisabledSelects(data);

                // Enable the next select after the current one
                var currentSelect = event.target;
                var nextSelect = currentSelect.nextElementSibling;
                if (nextSelect && nextSelect.tagName === 'SELECT') {
                    nextSelect.disabled = false;
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }
}

function populateSelectWithFilterValues(jsonData, containerId) {
    var data = JSON.parse(jsonData);
    var container = document.getElementById(containerId);

    data.results.forEach(function(filter, index) {
        var selectId = 'select-' + filter.label.replace(/\s+/g, '-').toLowerCase();
        var selectElement = document.getElementById(selectId) || document.createElement('select');
        selectElement.classList.add("select__select");
        selectElement.id = selectId;

        if (index > 0) {
            selectElement.disabled = true;
        }

        if (!selectElement.hasEventListener) {
            selectElement.addEventListener('change', handleFilterChange);
            selectElement.hasEventListener = true;
        }

        populateOptionsForSelect(filter, selectElement);
        if (!document.getElementById(selectId)) {
            container.appendChild(selectElement);
        }
    });
}

function initializeAjaxCollection(courl = 'c2-mym') {
    console.clear();
    console.log("ajax Start");

    // Specify the view template parameter for the AJAX request
    var viewParam = 'DO-Not-Use';

    // Construct the URL for the AJAX request
    var ajaxUrl = base_url + '?view=' + viewParam;

    fetch(ajaxUrl)
        .then(response => response.text())
        .then(data => {
            if (data) {
                populateSelectWithFilterValues(data, 'data-search');
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

$(document).ready(function() {
    initializeAjaxCollection();
});

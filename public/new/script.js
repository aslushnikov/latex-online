var BASE_URL = 'https://latexonline.cc';

var form;

document.addEventListener('DOMContentLoaded', function() {
    form = new Form();
    populateExamples();
    document.querySelector('#build-url-button').addEventListener('click', onBuildURL);
});

var examplePresets = [
    {
        name: 'Awesome CV',
        type: 'git',
        sourceURL: 'https://github.com/posquit0/Awesome-CV',
        target: 'examples/resume.tex',
        command: 'xelatex'
    },
    {
        name: 'RoboCup Rule Book',
        type: 'git',
        sourceURL: 'http://github.com/RoboCupAtHome/RuleBook.git',
        target: 'Rulebook.tex',
        command: 'pdflatex'
    },
    {
        name: 'Machine Learning Cheat Sheet',
        type: 'git',
        sourceURL: 'https://github.com/soulmachine/machine-learning-cheat-sheet',
        target: 'machine-learning-cheat-sheet.tex',
        command: 'xelatex'
    },

];

function populateExamples() {
    var tbody = document.querySelector('.examples tbody');
    return;
    for (var i = 0; i < examplePresets.length; ++i) {
        var example = examplePresets[i];

        var tr = appendRow(tbody);
        appendColumn(tr, createLink(example.sourceURL, example.name)).classList.add('sourceurl-row');
        appendColumn(tr, document.createTextNode(example.target)).classList.add('target-row');
        appendColumn(tr, document.createTextNode(example.command)).classList.add('command-row');
        appendColumn(tr, createBuildLink(example)).classList.add('buildurl-row');
    }

    function appendColumn(tr, node) {
        var td = document.createElement('td');
        td.appendChild(node);
        tr.appendChild(td);
        return td;
    }

    function appendRow(tbody) {
        var tr = document.createElement('tr');
        tbody.appendChild(tr);
        return tr;
    }

    function createLink(href, title) {
        var node = document.createElement('a');
        node.textContent = title || href;
        node.setAttribute('href', href);
        node.setAttribute('target', '_blank');
        return node;
    }

    function createBuildLink(example) {
        var buildURL = generateURL(example);
        var node = document.createElement('a');
        node.textContent = 'open_in_new';
        node.classList.add('material-icons');
        node.classList.add('example-build-link');
        node.setAttribute('href', buildURL);
        node.setAttribute('target', '_blank');
        return node;
        //<i class="material-icons">open_in_new</i>
    }
}

function onBuildURL() {
    var parameters = {
        sourceURL: form.sourceURL(),
        target: form.target(),
        command: form.command()
    }
    var url = generateURL(parameters);
    window.open(url);
}

function generateURL(parameters) {
    var components = [
        BASE_URL + '/compile',
        '?git=' + parameters.sourceURL,
        '&target=' + parameters.target,
        '&command=' + parameters.command
    ];
    return components.join(''); 
}

// ----- Form -----

function Form() {
    this._sourceURLInput = document.querySelector('#source-url-input');
    this._targetInput = document.querySelector('#target-input');
    this._commandSelect = document.querySelector('#command-select');
}

Form.prototype = {
    sourceURL: function() {
        return this._sourceURLInput.value;
    },

    setSourceURL: function(value) {
        this._sourceURLInput.value = value;
    }, 

    target: function() {
        return this._targetInput.value;
    },

    setTarget: function(value) {
        this._targetInput.value = value;
    },

    command: function() {
        return this._commandSelect.value;  
    },

    setCommand: function(value) {
        this._commandSelect.value = value;
    },
}

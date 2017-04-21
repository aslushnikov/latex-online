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
    var examplesSelect = document.querySelector('#examples-select');

    for (var i = 0; i < examplePresets.length; ++i) {
        var example = examplePresets[i];
        var option = document.createElement('option');
        option.__example = example;
        option.textContent = example.name;
        examplesSelect.appendChild(option);
    }
    examplesSelect.addEventListener('input', onExample);

    function onExample() {
        var option = examplesSelect.selectedOptions[0];
        if (!option || !option.__example)
            return;
        var example = option.__example;
        var urlInput = document.querySelector('#source-url-input');
        var commandSelect = document.querySelector('#command-select');
        urlInput.value = example.sourceURL + '/blob/master/' + example.target;
        commandSelect.value = example.command;
    }
}

function isGithub(url) {
    var parsedURL;
    try {
        parsedURL = new URL(url);
    } catch(e) {
        return false;
    }
    return parsedURL && parsedURL.host === 'github.com';
}

function onBuildURL() {
    var sourceURL = form.sourceURL();
    if (!isGithub(sourceURL)) {
        alert('not a github repository!');
        return;
    }
    var url = new URL(sourceURL);
    var tokens = url.pathname.split('/');
    var github = tokens[1] + '/' + tokens[2];
    // skip tokens 2 and 3: blob and master.
    var relativePath = tokens.slice(5).join('/');

    var parameters = {
        sourceURL: 'https://github.com/' + github,
        target: relativePath,
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

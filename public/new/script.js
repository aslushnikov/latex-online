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
        sourceURL: 'https://github.com/posquit0/Awesome-CV',
        target: 'examples/resume.tex',
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
    examplesSelect.addEventListener('input', onExampleSelected.bind(null, examplesSelect));
}

function onExampleSelected(examplesSelect) {
    var example = examplesSelect.selectedOptions[0].__example;
    if (!example)
        return;
    form.setSourceURL(example.sourceURL);
    form.setTarget(example.target);
    form.setCommand(example.command);
}

function onBuildURL() {
    window.open(form.generateURL());
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

    generateURL: function() {
        var components = [
            BASE_URL + '/compile',
            '?git=' + this.sourceURL(),
            '&target=' + this.target(),
            '&command=' + this.command()
        ];
        return components.join('');
    }
}
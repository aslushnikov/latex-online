document.addEventListener('DOMContentLoaded', onLoaded);

function onLoaded() {
    populateExamples();
}

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
    examplesSelect.addEventListener('input', onExampleSelected);
//            <option value="Option 1">Examples</option>

}

function onExampleSelected(event) {
    var example = event.target.selectedOptions[0].__example;
    if (!example)
        return;
    var sourceURLInput = document.querySelector('#source-url-input');
    var targetInput = document.querySelector('#target-input');
    var commandSelect = document.querySelector('#command-select');

    sourceURLInput.value = example.sourceURL;
    targetInput.value = example.target;
    commandSelect.value = example.command;
}
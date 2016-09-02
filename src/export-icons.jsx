// $.level = 2;
/**
 * Script for exporting icons to separate PNG files.
 *
 * Grzegorz Rajchman (c) 2016
 * Based on script by Damien van Holten:
 * http://www.damienvanholten.com/blog/export-groups-to-files-photoshop/
 */

function main()
{
    if (!documents.length) return;

    var iconBaseSize = 16;
    var iconNamePrefix = 'file_type_';
    var outputFolder = '../icons';

    var srcDocument = activeDocument;
    var srcPath = activeDocument.path;
    var outPath = srcPath + '/' + outputFolder;
    var outFolder = new Folder(outPath);

    if (!outFolder.exists) {
        outFolder.create();
    }

    var layerSets = getLayerSets();
    scanLayerSets(layerSets);

    function getLayerSets()
    {
        var all = confirm('Do you wish to export only selected icons (Yes) or all of them (No)?');

        if (all) {
            return getSelectedLayerSets();
        }

        return getAllLayerSets();
    }

    function getAllLayerSets()
    {
        return srcDocument.layerSets;
    }

    function getSelectedLayerSets()
    {
        var layerArray = [];

        if (!srcDocument.activeLayer.layers) {
            return layerArray;
        }

        var actionDesc = new ActionDescriptor();

        var selRef = new ActionReference();
        selRef.putClass(stringIDToTypeID('layerSection'));
        actionDesc.putReference(charIDToTypeID('null'), selRef);

        var layerRef = new ActionReference();
        layerRef.putEnumerated(charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
        actionDesc.putReference(charIDToTypeID('From'), layerRef);

        // Step 1. Temporarily group all the selected layers
        executeAction(charIDToTypeID('Mk  '), actionDesc, DialogModes.NO);

        // Step 2. Store the current active layer's layers
        var tempLayerSet = srcDocument.activeLayer.layers;
        var layerIndex;

        // Step 3. Filter through the layers and store them to the results array
        for (layerIndex = 0; layerIndex < tempLayerSet.length; layerIndex++) {
            // Check only for LayerSets (Groups)
            if (tempLayerSet[layerIndex].hasOwnProperty('layers')) {
                layerArray.push(tempLayerSet[layerIndex]);
            }
        }

        // Step 4. Undo the temporary group
        executeAction(charIDToTypeID('undo'), undefined, DialogModes.NO);

        return layerArray;
    }

    function scanLayerSets(layerSets)
    {
        if (!layerSets.length) {
            alert('Please select at least one layer group.');
        }

        // A hack to avoid exporting all the groups as the first image
        var dummy = srcDocument.layers.getByName('Background');
        srcDocument.activeLayer = dummy;

        var layerIndex;

        for (layerIndex = 0; layerIndex < layerSets.length; layerIndex++) {
            var groupName = layerSets[layerIndex].name;

            if (groupName.substr(-4) == '.png') {
                var iconScale = getLayerScale(groupName);
                var layer = srcDocument.layers.getByName(groupName);

                saveLayer(layer, groupName, iconScale);
            }
        }
    }

    function getLayerScale(groupName)
    {
        var suffix = groupName.substr(-7, 3);

        if (suffix === '@3x') {
            return 3;
        }

        if (suffix === '@2x') {
            return 2;
        }

        return 1;
    }

    function saveLayer(layer, groupName, iconScale)
    {
        iconScale = iconScale || 1;

        var fileName = iconNamePrefix + groupName;
        var filePath = File(outPath + '/' + fileName);
        var pxSize = UnitValue(iconBaseSize * iconScale, 'px');

        activeDocument.activeLayer = layer;
        duplicateToNewFile(groupName);

        activeDocument.mergeVisibleLayers();
        activeDocument.trim(TrimType.TRANSPARENT, true, true, true, true);
        activeDocument.resizeCanvas(pxSize, pxSize);

        savePNG(filePath);
        app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
    }

    function duplicateToNewFile(name)
    {
        var desc143 = new ActionDescriptor();
        var ref73 = new ActionReference();

        ref73.putClass(charIDToTypeID('Dcmn'));
        desc143.putReference(charIDToTypeID('null'), ref73);
        desc143.putString(charIDToTypeID('Nm  '), name);

        var ref74 = new ActionReference();
        ref74.putEnumerated(charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
        desc143.putReference(charIDToTypeID('Usng'), ref74);
        executeAction(charIDToTypeID('Mk  '), desc143, DialogModes.NO);
    }

    function savePNG(saveFile)
    {
        var pngOpts = new ExportOptionsSaveForWeb();

        pngOpts.format = SaveDocumentType.PNG;
        pngOpts.PNG8 = false;
        pngOpts.transparency = true;
        pngOpts.interlaced = false;
        pngOpts.quality = 100;

        activeDocument.exportDocument(
            new File(saveFile), ExportType.SAVEFORWEB, pngOpts
       );
    }
}

main();

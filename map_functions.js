let mouseX, mouseY;
$(document).mousemove(function(e) { mouseX = e.pageX; mouseY = e.pageY; }); 

const aggregateData = (data, src) => {
    let arr = [];
    let res = { data: [], dataSetMaxVisits: 0 }
    for (let i of src) {
        for (let j of data[i]) {
            arr.push(j);
        }
    }
    res.data = Array.from(arr.reduce((m, {key, visits}) => m.set(key, (m.get(key) || 0) + visits), new Map), ([key, visits]) => ({key, visits}))
    res.dataSetMaxVisits = Math.max.apply(Math, res.data.map(function(x) { return x.visits; }));
    return res;
};
const markerColorSpectrum = new Rainbow().setSpectrum('#ff8a6f', '#933941').setNumberRange(0, 1);
const addMapMarkers = (src, useSmallerCircles) => {
    let data = src['data'];
    for (let i in data) {
        let latLng = getLatLngFromKey(data[i].key);
        let latLngObj = L.latLng(latLng[0], latLng[1]);
        let markerColor = '#' + markerColorSpectrum.colorAt(data[i].visits / src.dataSetMaxVisits);
        let markerFillOpacity = 0.33;
        let radiusMultiplier = useSmallerCircles ? Math.cbrt(data[i].visits) : Math.sqrt(data[i].visits);
        L.circle(latLngObj, {
            radius: 30 * radiusMultiplier,
            weight: 2,
            color: markerColor,
            fillOpacity: markerFillOpacity
        }).addTo(layerGroup_dataMarker).on('mouseover', function(e) {
            let tooltip = $('#map-tooltip');
            let tooltipLocation = getNameFromKey(data[i].key) ? `<b>${getNameFromKey(data[i].key)}</b><br>` : '';
            let tooltipText = `${tooltipLocation}Visits: ${data[i].visits}`;
            tooltip.children('span').css('display', 'block');
            tooltip.children('span').html(tooltipText);
            $(this).mousemove(function(e) {
                tooltip.css({ 'top': mouseY - 30 - $('#map-wrapper-box').position().top,
                'left': mouseX + 15 - $('#map-wrapper-box').position().left });
            })
            $(this).mouseout(function(e) {
                tooltip.children('span').css('display', 'none');
            });
        });
    }
};
const clearMapMarkers = () => {
    layerGroup_dataMarker.clearLayers();
};
const viewMapData = (n, useSmallerCircles) => {
    if (useSmallerCircles == undefined) {
        useSmallerCircles = true;
    }
    clearMapMarkers();
    addMapMarkers(n, useSmallerCircles);
};
const getNameFromKey = (value) => {
    for (let i in dictionary) {
        if (dictionary[i]['key'] === value) {
            if (dictionary[i].name != undefined) {
                return dictionary[i].name;
            } else {
                return false;
            }
        }
    }
}
const getLatLngFromKey = (value) => {
    for (let i in dictionary) {
        if (dictionary[i]['key'] === value) {
            return dictionary[i].latLng;
        }
    }
}

let dictionary = [];
let before_aggregate = [];
let after_aggregate = [];
let before_aggregate_selection = ['1.19', '2.19', '3.19', '4.19', '5.19', '6.19', '7.19', '8.19', '9.19', '10.19', '11.19', '12.19', '1.20', '2.20', '3.20'];
let after_aggregate_selection = ['4.20', '5.20', '6.20', '7.20', '8.20', '9.20', '10.20', '11.20', '12.20'];
let dataByMonth = { '2019': {}, '2020': {} };

$.getJSON('json/timeline.json', (res) => {
    let target;
    for (let i = 1; i <= 12; i++) {
        target = dataByMonth['2019'];
        target[i] = { data: [], dataSetMaxVisits: 0 };
        target[i].data = res[i + '.19'];
        target[i].dataSetMaxVisits = target[i].data.length > 0 ? Math.max.apply(Math, target[i].data.map(function(x) { return x.visits; })) : 0;
        target = dataByMonth['2020'];
        target[i] = { data: [], dataSetMaxVisits: 0 };
        target[i].data = res[i + '.20'];
        target[i].dataSetMaxVisits = target[i].data.length > 0 ? Math.max.apply(Math, target[i].data.map(function(x) { return x.visits; })) : 0;
    }
    before_aggregate = aggregateData(res, before_aggregate_selection);
    after_aggregate = aggregateData(res, after_aggregate_selection);
});

$.getJSON('json/dictionary.json', (res) => {
    dictionary = res['dictionary'];
})

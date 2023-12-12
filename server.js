let HTMLParser = require('node-html-parser');
let PORT = process.env.PORT || 6411;
let XMLHttpRequest = require('xhr2');
let express = require('express');
let http = require('http');
let path = require('path');
let app = express();
let server = http.Server(app);
let bp = require('body-parser');
const fs = require("fs");

app.use(express.static(__dirname + '/static'));
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});
server.listen(PORT, function() {
    console.log('Server is running and ready to work, go to the browser and enter 127.0.0.1:6411');
});

app.get('/rasp', (req, res) => {
    console.log(req.url);
    let request = new XMLHttpRequest();
    let url = "https://ssau.ru" + req.url;
    request.open("GET", url, true);
    request.send(null);
    request.onreadystatechange = () => {
        if (request.readyState == 4) {
            let schedule = {
                dates: [],
                daysOfSchedule: [],
                times: []
            };
            let root = HTMLParser.parse(request.responseText);

            // parse days with dates
            for (let cell of root.querySelectorAll(".schedule__item + .schedule__head")) {
                schedule.dates.push(cell.childNodes[0].innerText + cell.childNodes[1].innerText)
            }

            console.log(root.querySelector(".week-nav-current_week")?.innerText);

            // parse all cells
            for (let cell of root.querySelectorAll(".schedule__item")) {
                if (cell.childNodes[0]?.childNodes.length > 3) {
                    let groups = [];
                    if (typeof req.query.staffId === "undefined") {
                        cell.childNodes[0].childNodes[3].childNodes
                            .filter((group) => group.innerText.trim() !== "")
                            .map((group) => {
                                let ind1 = 0;
                                while (!isNumber(group.toString()[ind1]) && ind1 < 100) ind1++;
                                let ind2 = ind1;
                                while (isNumber(group.toString()[ind2]) && ind2 < 100) ind2++;
                                while (group.toString()[ind1] !== "?" && ind1 > 0) ind1--;
                                let id = group.toString().slice(ind1, ind2);
                                groups.push(JSON.stringify({
                                    name: group.innerText,
                                    link: isNumber(id[id.length - 4]) ? `/rasp${id}` : null
                                }))
                            })
                    } else {
                        let groupsElements = cell.querySelectorAll("a")
                            .filter((group) => group.innerText.trim() !== "")
                            .map((group) => {
                                let ind1 = 0;
                                while (!isNumber(group.toString()[ind1]) && ind1 < 100) ind1++;
                                let ind2 = ind1;
                                while (isNumber(group.toString()[ind2]) && ind2 < 100) ind2++;
                                while (group.toString()[ind1] !== "?" && ind1 > 0) ind1--;
                                let id = group.toString().slice(ind1, ind2);
                                groups.push(JSON.stringify({
                                    name: group.innerText,
                                    link: isNumber(id[id.length - 4]) ? `/rasp${id}` : null
                                }))
                            })
                        console.log(groups);
                    }

                    let id = "";
                    if (typeof req.query.staffId === "undefined") {
                        let teacher = cell.childNodes[0].childNodes[2].childNodes;
                        let ind1 = 5;
                        while (!isNumber(teacher.toString()[ind1]) && ind1 < 100) ind1++;
                        let ind2 = ind1;
                        while (isNumber(teacher.toString()[ind2]) && ind2 < 100) ind2++;
                        while (teacher.toString()[ind1] !== "?" && ind1 > 0) ind1--;
                        id = teacher.toString().slice(ind1, ind2);
                    }

                    schedule.daysOfSchedule.push({
                        subject: cell.childNodes[0].childNodes[0].innerText.slice(1),
                        place: cell.childNodes[0].childNodes[1].innerText.slice(1),
                        teacher: JSON.stringify(typeof req.query.staffId === "undefined" ? {
                            name: cell.querySelector(".schedule__teacher")?.innerText ?? cell.childNodes[0].childNodes[2].childNodes[0].innerText,
                            link: isNumber(id[id.length - 1]) ? `/rasp${id}` : null } : { name: "", link: "" }),
                        groups: groups
                    })
                } else {
                    schedule.daysOfSchedule.push({
                        subject: null
                    })
                }
            }

            // parse times of first column
            for (let cell of root.querySelectorAll(".schedule__time")) {
                schedule.times.push(cell.childNodes[0].innerText + " - " + cell.childNodes[1].innerText);
            }

            // remove from field with subjects all headers with dates
            schedule.daysOfSchedule = schedule.daysOfSchedule.slice(7);
            schedule.currentWeek = root.querySelector(".week-nav-current_week")?.innerText.slice(1, 3).trim();
            res.send(JSON.stringify(schedule));
        }
    };
})

app.get('/getGroups', (req, res) => {
    let readyStateCount = 0;
    let result = { groups: [] };
    for (let i = 1; i < 6; i++) {
        let request = new XMLHttpRequest();
        let url = "https://ssau.ru/rasp/faculty/492430598?course=" + i;

        request.open("GET", url, true);
        request.send(null);
        request.onreadystatechange = () => {
            if (request.readyState == 4) {
                let root = HTMLParser.parse(request.responseText);
                let groups = root.querySelectorAll(".group-catalog__groups > a");
                for (let group of groups) {
                    console.log(group.innerText);
                    let ind1 = 0;
                    while (!isNumber(group.toString()[ind1]) && ind1 < 100) ind1++;
                    let ind2 = ind1;
                    while (isNumber(group.toString()[ind2]) && ind2 < 100) ind2++;
                    while (group.toString()[ind1] !== "?" && ind1 > 0) ind1--;
                    let id = group.toString().slice(ind1, ind2);
                    result.groups.push({ name: group.innerText, link: `/rasp${id}` })
                }
                readyStateCount++;
                if (readyStateCount === 5)
                    res.send(JSON.stringify(result));
            }
        };
    }
})

app.get('/getTeachers', (req, res) => res.sendFile(path.join(__dirname, 'teachers.json')))

function parseTeachers() {
    let teachersString = [];
    let result = { teachers: [] };
    let readyStateCount = 0;
    for (let i = 1; i < 116; i++) {
        let request = new XMLHttpRequest();
        let url = "https://ssau.ru/staff?page=" + i;
        request.open("GET", url, true);
        request.send(null);
        request.onreadystatechange = () => {
            if (request.readyState == 4) {
                teachersString.push(request.responseText);
                readyStateCount++;
                if (readyStateCount === 115) {
                    for (let teacher of teachersString) {
                        let root = HTMLParser.parse(teacher);
                        let teachers = root.querySelectorAll(".list-group-item > a");
                        for (let t of teachers) {
                            let staffId = t.getAttribute("href").replace(/\D/g, '');
                            result.teachers.push({ name: t.innerText, link: `/rasp?staffId=${staffId}` });
                        }
                    }
                    fs.writeFile('teachers.json', JSON.stringify(result), 'utf8', (err) => {
                        if (err) {
                            console.log('Error on writing file');
                        }
                        console.log('saved');
                    });
                }
            }
        };
    }
}
// parseTeachers();

function isNumber(char) {
    if (typeof char !== 'string') {
        return false;
    }

    if (char.trim() === '') {
        return false;
    }

    return !isNaN(char);
}
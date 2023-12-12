fetch('/rasp?groupId=531873998')
    .then((data) => data.json())
    .then((res) => {
        console.log(res);
        renderSchedule(res);
        currentWeek = parseInt(res.currentWeek);
        document.querySelector("#currentWeek").innerHTML = `${currentWeek} неделя`;
        if (currentWeek == 1) {
            document.querySelector("#previousButton").style.visibility = "hidden";
        } else {
            document.querySelector("#previousButton").style.visibility = "visible";
        }
    })
setTimeout(() => {
    fetch('/getGroups')
        .then((data) => data.json())
        .then((res) => {
            console.log('asdasdas');
            console.log(res);
    
            let selectElement = document.querySelector("#select");
            for (let group of res.groups) {
                    let groupElement = document.createElement("option");
                    groupElement.innerHTML = group.name;
                    groupElement.setAttribute("value", group.link);
                    selectElement.appendChild(groupElement);
                }
            selectElement.addEventListener("change", () => {
                    updateSchedule(selectElement.value);
            })
        })
}, 1000);

setTimeout(() => {
    fetch('/getGroups')
        .then((data) => data.json())
        .then((res) => {
            // Считываем элементы input и list
            const searchInput = document.querySelector("#searchInput");
            const list = data;

            // Добавляем прослушиватель событий при вводе в input
            searchInput.addEventListener("input", function () {
            // Получаем поисковый запрос
            const searchTerm = this.value.toLowerCase();

            // Перебираем элементы списка
            for (let i = 0; i < list.children.length; i++) {
                const item = list.children[i];

                // Если поисковый запрос найден в тексте элемента, показываем его
                if (item.textContent.toLowerCase().indexOf(searchTerm) !== -1) {
                    console.log('asdasdas');
                    console.log(res);
        
                    let selectElement = document.querySelector("#select");
                    for (let group of res.groups) {
                        let groupElement = document.createElement("option");
                        groupElement.innerHTML = group.name;
                        groupElement.setAttribute("value", group.link);
                        selectElement.appendChild(groupElement);
                    }
                    selectElement.addEventListener("change", () => {
                        updateSchedule(selectElement.value);
                    })
                item.style.display = "block";
                } else {
                item.style.display = "none";
                }
            }
            });
        })
}, 1000);


setTimeout(() => {
    fetch('/getTeachers')
        .then((data) => data.json())
        .then((res) => {
            console.log(res);
            let selectElement = document.querySelector("#selectTeacher");
            for (let teacher of res.teachers) {
                let teacherElement = document.createElement("option");
                teacherElement.innerHTML = teacher.name;
                teacherElement.setAttribute("value", teacher.link);
                selectElement.appendChild(teacherElement);
            }
            selectElement.addEventListener("change", () => {
                updateSchedule(selectElement.value);
            })
        })
}, 1000);

let currentUrl = '/rasp?groupId=531873998';
let currentWeek;
let currentDay = new Date().getDay();
let styles = "";
let styleSheet = document.createElement("style");
styleSheet.classList.add("schedule-style");

function changeDayOnMobile(goNextDay = undefined) {
	if (currentDay === 6) {
        currentDay = 5;
    }
    styles = "";
    let isInitState = false;

    if (typeof goNextDay === "undefined") {
        isInitState = true;
    }
    if (!isInitState) {
        document.head.removeChild(styleSheet);
        if (goNextDay) {
            currentDay === 5 ? currentDay = 0 : currentDay++;
        } else {
            currentDay === 0 ? currentDay = 5 : currentDay--;
        }
    }

    for (let i = 0; i < 7; i++) {
        if (i === currentDay) continue;
        styles += `
            .column-${i} {
                display: none;
            }
            
        `
    }
    console.log(currentDay);
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

window.addEventListener("resize", () => {
    if (window.innerWidth < 481) {
        changeDayOnMobile();
        let btn = document.querySelector("#nextDay");
        btn.style.display = "block";
        btn = document.querySelector("#previousDay");
        btn.style.display = "block";
    } else {
        if (document.querySelector(".schedule-style")) {
            let btn = document.querySelector("#nextDay");
            btn.style.display = "none";
            btn = document.querySelector("#previousDay");
            btn.style.display = "none";
            document.head.removeChild(styleSheet);
        }
    }
})

function updateSchedule(url) {
    currentUrl = url;
    fetch(url)
        .then((data) => data.json())
        .then((res) => {
            renderSchedule(res);
            console.log(res);
            currentWeek = parseInt(res.currentWeek);
            document.querySelector("#currentWeek").innerHTML = `${currentWeek} неделя`;
            if (currentWeek == 1) {
                document.querySelector("#previousButton").style.visibility = "hidden";
            } else {
                document.querySelector("#previousButton").style.visibility = "visible";
            }
        })
}

function renderSchedule(data) {
    let table = document.querySelector("#schedule");
    table.innerHTML = "";
    console.log(table);
    let headers = table.insertRow();
    headers.classList.add("first-row"); 
    headers.insertCell().appendChild(document.createTextNode("Время"));

    let ind = 0;
    for (let date of data.dates) {
        let cell = headers.insertCell();
        cell.appendChild(document.createTextNode(date));
        cell.classList.add(`column-${ind}`);
        ind++;
    }

    ind = 0;
    let days = data.daysOfSchedule;

    for (let time of data.times) {
        let row = table.insertRow();
        row.classList.add("one-row"); 
        row.insertCell().appendChild(document.createTextNode(time));

        for (let day of days) {
            if (ind > 5) {
                break;
            }
            if (day.subject !== null) {
                let infoToInsert = document.createElement("div");
                let correctTeacher = JSON.parse(day.teacher);
                infoToInsert.innerHTML = `${day.subject}<br>${day.place}<br>`;
                let teacherElement;
                if (correctTeacher.link !== null) {
                    teacherElement = document.createElement("a");
                    teacherElement.href = "#";
                    teacherElement.innerHTML = correctTeacher.name;
                    teacherElement.addEventListener('click', () => updateSchedule(correctTeacher.link));
                } else {
                    teacherElement = document.createElement("div");
                    teacherElement.innerHTML = correctTeacher.name;
                }
                infoToInsert.classList.add("text-style1"); 
                infoToInsert.appendChild(teacherElement);
                infoToInsert.appendChild(document.createElement("br"));
                console.log(correctTeacher);
                for (let group of day.groups) {
                    let correctGroup = JSON.parse(group);
                    let aNode;
                    if (correctGroup.link !== null) {
                        aNode = document.createElement("a");
                        aNode.href = "#";
                        aNode.innerHTML = correctGroup.name;
                        aNode.addEventListener('click', () => updateSchedule(correctGroup.link));
                    } else {
                        aNode = document.createElement("div");
                        aNode.innerHTML = correctGroup.name;
                    }
                    infoToInsert.appendChild(aNode);
                    infoToInsert.appendChild(document.createElement("br"));
                }
                let cell = row.insertCell();
                cell.classList.add(`column-${ind}`);
                cell.appendChild(infoToInsert);
                cell.classList.add("one-cell"); 
            } else {
                let cell = row.insertCell();
                cell.classList.add("one-cell"); 
                cell.classList.add(`column-${ind}`);
            }
            ind++;
        }
        days = days.slice(ind);
        ind = 0;
    }
}

function changePage(goNextPage) {
    let ind = 0;
    while (currentUrl[ind] !== "&" && ind <= 100) ind++;
    if (currentUrl[ind] !== "&") {
        currentUrl += `&selectedWeek=${goNextPage ? currentWeek + 1 + "" : currentWeek - 1 + ""}`;
    } else {
        currentUrl = currentUrl.slice(0, currentUrl.length - (currentWeek > 9 ? 2 : 1));
        currentUrl += goNextPage ? currentWeek + 1 + "" : currentWeek - 1 + "";
    }
    console.log(currentWeek);
    console.log(currentUrl);
    updateSchedule(currentUrl);
}

/*
    Credits for code:
    Ringlings
    Alli
    Purrrpley
*/

// Collect system ID from query string
const queryString = window.location.search;
const system = new URLSearchParams(queryString).get("sys");

// Main document container
const container = document.querySelector('.container');

// Helper function for interacting with the PluralKit API
async function pkAPI(path) {
    // Fetch from the PluralKit API
    let response = await fetch('https://api.pluralkit.me/v2/' + path)
    // Handle error if there is one
    if (response.status != 200) {
        showInput(response.status)
        return null
    }
    return await response.json()
}

async function getFronters(system) {
    let fronters = (await pkAPI(`systems/${system}/fronters`)).members
    // Return only the UUIDs. The other data we get from the `getMembers()`
    // call, so we only need to store it there and not here too. If the system
    // is switched out, it will return an empty array.
    return fronters.map(i => {
        return i.uuid
    })
}

async function getMembers(system) {
    return await pkAPI(`systems/${system}/members`)
}

async function getSystemInfo(system) {
    return await pkAPI(`systems/${system}`)
}

// Separate members into groups depending on whether they're fronting or not
function separateMembers(fronting, members) {
    return {
        'fronting': members.filter(member => {
            return fronting.indexOf(member.uuid) != -1
        }),
        'nonFronting': members.filter(member => {
            return fronting.indexOf(member.uuid) == -1
        })
    }
}

function backButton() {
    // Back Button (Alli)
    let segment = `<form>
                        <input type="submit" value="Go Back">
                    </form>
                    <!--<br>
                    <a href="systems.html">
                        <input type="submit" value="System info">
                    </a>-->`

    let goBack = document.querySelector('.goBack');
    goBack.innerHTML = segment;

}

async function renderCard(member, isFronting) {
    /* TODO: Replace this with switch start time
    let dateObject
    let fronterCreated
    if(fronter.created != null) {
        dateObject = fronter.created;
        fronterCreated = dateObject.toLocaleString();
    }
    */
    return `
        <div class="card ${isFronting ? 'fronting' : 'non-fronting'}", style="border-left-color: #${member.color}">
            <img src="${member.avatar_url == null ? 'blank.png' : member.avatar_url}" alt="Profile Picture">
            <h2>${member.name}</h2>
            <p>${member.pronouns == null ? 'This member has no pronouns set.' : member.pronouns}</p>
        </div>
    `
}

async function renderCards(system) {
    // Fetch requests in parallel
    let [fronting, members] = await Promise.all([
        getFronters(system),
        getMembers(system),
    ])
    
    // Separate the members
    members = separateMembers(fronting, members)
    delete fronting
    
    let html = ''
    for (const fronter of members.fronting) {
        html += await renderCard(fronter, true)
    }
    for (const nonFronter of members.nonFronting) {
        html += await renderCard(nonFronter, false)
    }
    
    // Display the formatted fronters
    container.innerHTML = html;
    
    backButton()
}

async function updateTitles(system) {
    let systemInfo = await getSystemInfo(system)
    
    const nameContainer = document.getElementById("name-container");
    const tabName = document.getElementById('tabname')
    
    // If the system doesn't have a name, fallback to its ID
    systemName = systemInfo.name == null ? systemInfo.id : systemInfo.name
    
    // Update the tab name
    tabName.innerHTML = `${systemName} Fronter Display`
    
    // If the system doesn't have a name and is falling back to using its ID,
    // wrap it in `<code>`
    if (systemInfo.name == null) {
        systemName = `<code>${systemInfo.id}</code>`
    }
    
    // Change the name container (heading). This also colours the system name
    // in the system's specified colour (if it has one).
    nameContainer.innerHTML = `
        <h1>
            ${
                systemInfo.color == null
                    ? `${systemName}`
                    : `<span style="color: #${systemInfo.color}">${systemName}</span>`
            } Fronter Display
        </h1>
    `
}

// Function for displaying system ID input
function showInput(reason) {
    let label;

    if (reason == 404) {
        // Not found
        label = "There is no system by that ID."
    }
    else if (reason == 403) {
        // Forbidden
        label = "This system has their fronters hidden."
    }
    else if (reason == null) {
        // No system ID provided
        label = "Please enter a system ID:"
    };

    // Create form for inputting system ID
    container.innerHTML = `<form>
                            <label name="sys">${label}</label>
                            <input type="text" name="sys">
                            <input type="submit" value="Submit">
                        </form>`
}

// Handles which display appears on the page
if (system != null & system != "") {
    // Display fronters for requested system
    container.innerHTML = `<code>Loading fronters...</code>`
    Promise.all([updateTitles(system), renderCards(system)])
}
else {
    // Display system input
    showInput(null)
};

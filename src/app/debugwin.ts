import { ipcRenderer, clipboard } from "electron"

const getdebuginfo = (debuginfo: DebugInfo) => {
    const { appid, gamename, pollrate, releasedelay, maxretries, steam3id, steam64id, username, userust, status } = debuginfo

    const lbls = new Map<string,any>([
        ["username",username || ""],
        ["steam3id",steam3id || ""],
        ["steam64id",steam64id || ""],
        ["appid",appid],
        ["status",status || "Released"],
        ["gamename",gamename || ""],
        ["pollrate",pollrate || 250],
        ["releasedelay",releasedelay || 0],
        ["maxretries",maxretries],
        ["userust",userust ? "Rust" : "Node"]
    ])

    return lbls
}

ipcRenderer.on("debuginfoupdated", (event,debuginfo: DebugInfo,reset?: boolean) => {
    const { processes, vdfentry } = debuginfo
    const lbls = getdebuginfo(debuginfo)

    if (reset) document.getElementById("processes")!.innerHTML = ""

    lbls.forEach((value,key) => {
        const elem = document.querySelector(`#${key} > .value`)!
        
        if (reset) {
            // Reset "textContent" to original value stated in "lbls" Map
            elem.textContent = lbls.get(key)
        } else {
            // Update value only if different from current "textContent"
            if (((key === "appid" && value === undefined) || value !== 0) && !value) return
            elem.textContent !== value.toString() && (elem.textContent = value)
        }
    })

    const debugprocesses = processes as DebugProcessInfo[]
    if (!debugprocesses) return

    const processeselem = document.getElementById("processes")!

    debugprocesses.forEach(({ exe, pid, active }: DebugProcessInfo,i) => {
        const exeelem = document.getElementById(`exe_${i}`)
        const imgelem = document.getElementById(`activity_${i}`)! as HTMLImageElement

        if (exeelem) {
            exeelem.textContent = exe
            imgelem.src = `../../icon/dot_${active ? "green" : "red"}.png`
            return
        }

        const html = `
            <div class="wrapper process">
                <div class="exe">
                    <span class="key">Executable</span>
                    <code class="value" id="exe_${i}">${exe}</code>
                </div>
                <div class="pid">
                    <span class="key">PID</span>
                    <code class="value" id="pid_${i}">${pid}</code>
                </div>
                <img id="activity_${i}" src="../../icon/dot_${active ? "green" : "red"}.png">
                <div id="copyicon"></div>
            </div>
        `
        processeselem.insertAdjacentHTML("beforeend",html)

        if (vdfentry) {
            const processelem = processeselem.querySelector(`.process:has(img#activity_${i})`) as HTMLElement | null
            if (!processelem) return
    
            processelem.onclick = () => {
                try {
                    clipboard.writeText(JSON.stringify(vdfentry,null,4))
                    processelem.setAttribute("copied","")
                } catch (err) {
                    processelem.setAttribute("failed","")
                }

                setTimeout(() => {
                    for (const attr of (["copied","failed"] as const)) {
                        processelem.removeAttribute(attr)
                    }
                },500)
            }
        }
    })
})

document.addEventListener("DOMContentLoaded", () => ipcRenderer.send("debugwinready"))
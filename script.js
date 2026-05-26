let customQuestions = [];
let finalRoleToSave = ""; 
let currentActiveEventId = null;

async function showPage(pageId) {
    const pages = document.querySelectorAll("section, .page, .dashboard-page");
    pages.forEach(p => p.classList.add("hidden"));

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove("hidden");
    }

    if (pageId !== "adminScanner" && html5QrcodeScanner) {
        try {
            await html5QrcodeScanner.clear();
            html5QrcodeScanner = null;
            const readerEl = document.getElementById("qr-reader");
            if (readerEl) readerEl.innerHTML = "";
            const resultsEl = document.getElementById("qr-reader-results");
            if (resultsEl) resultsEl.innerText = "";
        } catch (err) {
            console.error(err);
        }
    }

    if (pageId === "adminScanner") {
        if (typeof startQRScanner === "function") {
            startQRScanner();
        }
    }

    if (pageId === "adminHome" || pageId === "studentHome") {
    loadEvents();
    }    
}

document.addEventListener("input", function(e) {
  if (
    e.target.type !== "email" &&
    e.target.id !== "registerEmail" &&
    e.target.id !== "studentEmail" &&
    e.target.id !== "adminEmail" &&
    e.target.id !== "studentPassword" &&
    e.target.id !== "adminPassword" &&
    e.target.id !== "password" &&
    e.target.id !== "confirmPassword" &&
    e.target.id !== "description" &&
    e.target.id !== "title" &&
    e.target.id !== "time_limit"
  ) {
    e.target.value = e.target.value.toUpperCase();
  }
});


async function studentLogin() {
    const email = document.querySelector("#studentEmail").value;
    const password = document.querySelector("#studentPassword").value;

    if (!email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    if (!email.endsWith("@rtu.edu.ph")) {
        alert("Only RTU institutional email allowed.");
        return;
    }

    const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", data.role); 
        alert("Student Login successful!");
        showPage("studentHome");
    } else {
        alert(data.detail || "Login failed");
    }
}

async function adminLogin() {
    const email = document.querySelector("#adminEmail").value;
    const password = document.querySelector("#adminPassword").value;

    if (!email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    if (!email.endsWith("@rtu.edu.ph")) {
        alert("Only RTU institutional email allowed.");
        return;
    }

    const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", data.role); 
        alert("Admin Login successful!");
        showPage("adminHome");
    } else {
        alert(data.detail || "Login failed");
    }
}

async function registerUser() {
    const role = document.querySelector('input[name="roleStudent"]:checked')?.value
                || document.querySelector('input[name="roleAdmin"]:checked')?.value;

    const name = document.getElementById("studentRegisterName")?.value 
                || document.getElementById("adminRegisterName")?.value;

    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("registerConfirmPassword").value;

    if (!email.endsWith("@rtu.edu.ph")) {
        alert("Only RTU institutional email allowed.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    if (!name || !name.trim()) {
        alert("Name is required.");
        return;
    }

    if (!finalRoleToSave) {
        alert("Session error: Please go back to Step 1 and select your role again.");
        return;
    }

    const res = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password, role: finalRoleToSave })
    });

    if (res.ok) { 
        alert("Account created successfully! You will be directed to the admin home page.");
        finalRoleToSave = "";
        resetPage("accountCreationStep2");
        resetPage("accountCreationForStudent");
        resetPage("accountCreationForAdmin");
        resetPage("studentLogin");
        resetPage("adminLogin");
        showPage("start");
    } else {
        const data = await res.json();
        alert(data.detail || "Registration failed");
    }
}

function validateStep1() {
    const role = document.querySelector('input[name="roleStudent"]:checked')?.value
                || document.querySelector('input[name="roleAdmin"]:checked')?.value;
    
    const name = document.getElementById("studentRegisterName")?.value 
                || document.getElementById("adminRegisterName")?.value;
    
    if(!role) {
        return alert("Please select a role.");
    }

    if(!name?.trim()) {
        return alert("Name is required.");  
    }

    if(role === "roleStudent") {
        const studentNumber = document.getElementById("studentNumber")?.value;
        const yearLevel = document.getElementById("yearLevel")?.value;
        const department = document.getElementById("department")?.value;
        const course = document.getElementById("course")?.value;

        if (!studentNumber?.trim() || !yearLevel?.trim() || !department?.trim() || !course?.trim()) {
            alert("Please complete all information.");
            return;
        }
    }

    if (role === "roleAdmin") {
        const adminStudentNumber = document.getElementById("adminStudentNumber")?.value;
        const adminYearLevel = document.getElementById("adminYearLevel")?.value;
        const organization = document.getElementById("organization")?.value;
        const position = document.getElementById("position")?.value;

        if (!adminStudentNumber?.trim() || !adminYearLevel?.trim() || !organization?.trim() || !position?.trim()) {
            alert("Please complete all information");
            return;
        }
    }
    finalRoleToSave = role === "roleAdmin" ? "admin" : "student";
    showPage("accountCreationStep2");
}


//Scanner
let html5QrcodeScanner = null;

function onScanSuccess(decodedText, decodedResult) {
    document.getElementById('qr-reader-results').innerText = `Scanned ID/Data: ${decodedText}`;
    alert(`Attendance logged successfully for: ${decodedText}`);
    stopScannerAndGoBack();
}

function startQRScanner() {
    const qrReaderEl = document.getElementById("qr-reader");
    if (!qrReaderEl) return;

    if (!html5QrcodeScanner) {
        qrReaderEl.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px 20px; width: 100%; box-sizing: border-box;">
                <p style="font-weight: bold; margin-bottom: 20px; color: #555;">CAMERA SCANNER READY</p>
                <button id="triggerScanBtn" style="background: black; color: white; padding: 12px 30px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin: 0 auto; display: block;">START SCANNING</button>
            </div>
        `;

        document.getElementById("triggerScanBtn").addEventListener("click", () => {
            qrReaderEl.innerHTML = ""; 

            html5QrcodeScanner = new Html5QrcodeScanner(
                "qr-reader", 
                { 
                    fps: 15, 
                    qrbox: { width: 250, height: 250 },
                    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] 
                }, 
                false
            );
            html5QrcodeScanner.render(onScanSuccess, (error) => {});
        });
    }
}

function stopQRScannerEngineOnly() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().then(() => {
            html5QrcodeScanner = null;
            if (document.getElementById('qr-reader-results')) {
                document.getElementById('qr-reader-results').innerText = "";
            }
        }).catch(err => {
            console.error(err);
        });
    }
}

function stopScannerAndGoBack() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().then(() => {
            html5QrcodeScanner = null;
            document.getElementById('qr-reader-results').innerText = "";
            showPage('adminHome');
        }).catch(err => {
            showPage('adminHome');
        });
    } else {
        showPage('adminHome');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const toggleButtons = document.querySelectorAll(".toggle-password-btn");

    toggleButtons.forEach(button => {
        button.addEventListener("click", function (e) {
            e.preventDefault();

            const targetId = this.getAttribute("data-target");
            const targetInput = document.getElementById(targetId);

            if (targetInput) {
                const isHidden = targetInput.getAttribute("type") === "password";
                targetInput.setAttribute("type", isHidden ? "text" : "password");
                this.style.opacity = isHidden ? "0.4" : "1.0";
            }
        });
    });
});





//Event Creation
function addQuestion() {
  const container = document.getElementById("questionContainer");
  if (!container) return;

  const div = document.createElement("div");
  div.className = "question-box";

  div.innerHTML = `
    <input type="text" placeholder="Question Text" class="q-text">
    <button type="button" class="add-btn">Add</button>
    <button type="button" class="q-remove">Remove</button>
    <div class="question-preview"><br></div>
  `;

  container.appendChild(div);

  const input = div.querySelector(".q-text");
  const preview = div.querySelector(".question-preview");
  const addBtn = div.querySelector(".add-btn");
  const removeBtn = div.querySelector(".q-remove");
  
  let savedQuestionText = "";

  addBtn.addEventListener("click", () => {
    const question = input.value.trim();

    if (!question) {
      alert("Please enter a question");
      return;
    }

    savedQuestionText = question;

    customQuestions.push({
      question_text: question,
      question_type: "text"
    });

    preview.innerHTML = `
      <p>${question}</p>
      <input type="text" placeholder="Your answer" disabled>
    `;

    input.disabled = true;
    addBtn.disabled = true;
  });

  removeBtn.addEventListener("click", () => {
    if (savedQuestionText) {
      customQuestions = customQuestions.filter(q => q.question_text !== savedQuestionText);
    }
    
    div.remove();
    
    if (typeof updateQuestionPreview === "function") {
      updateQuestionPreview();
    }
  });
}

function showFinalPreview() {
  const preview = document.getElementById("finalPreview");
  if (!preview) return;


  const title = document.getElementById("title")?.value || "Event Title";
  const description = document.getElementById("description")?.value || "Event Description";
  const startTime = document.getElementById("startTime")?.value;
  const endTime = document.getElementById("endTime")?.value;


  function formatTime(timeStr) {
    if (!timeStr) return "";
    const [hour, minute] = timeStr.split(":");
    let h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minute} ${ampm}`;
  }


  const timeLimit = (startTime && endTime)
    ? `${formatTime(startTime)} to ${formatTime(endTime)} only`
    : "Not Set";


  preview.style.display = "block";


  preview.innerHTML = `
    <h2>FORM PREVIEW</h2>
    <p><strong>${title}</strong></p>
    <p><strong>${description}</strong></p>
    <p><strong>TIME: </strong>${timeLimit}</p>
    <p>NAME</p> <input type="text" disabled>
    <p>STUDENT NUMBER</p> <input type="text" disabled>
    <p>BLOCK</p> <input type="text" disabled>
    <p>DEPARTMENT</p> <input type="text" disabled>
    <p>COURSE</p> <input type="text" disabled>
    <div id="customQuestionsContainer"></div>
  `;


  const customContainer = document.getElementById("customQuestionsContainer");


  customQuestions.forEach(q => {
    customContainer.innerHTML += `
      <p>${q.question_text}</p>
      <input type="text">
    `;
  });
}


async function saveQuestions(eventId) {
  for (const q of customQuestions) {
    const data = {
      question_text: q.question_text,
      question_type: "text",
      required: false
    };

    await fetch(`http://127.0.0.1:8000/events/${eventId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  }
}

async function submitEvent(e) {
  if (e) {
    if (typeof e.preventDefault === "function") e.preventDefault();
    if (typeof e.stopPropagation === "function") e.stopPropagation();
  }

  try {
    const titleInput = document.getElementById("title");
    const descInput = document.getElementById("description");
    const startTimeInput = document.getElementById("startTime");
    const endTimeInput = document.getElementById("endTime");

    if (!titleInput || !titleInput.value.trim()) {
      alert("Please enter an event title");
      return;
    }

    function formatTime(timeStr) {
      if (!timeStr) return "";
      const [hour, minute] = timeStr.split(":");
      let h = parseInt(hour, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h}:${minute} ${ampm}`;
    }

    const finalTimeLimit = (startTimeInput?.value && endTimeInput?.value)
      ? `${formatTime(startTimeInput.value)} to ${formatTime(endTimeInput.value)} only`
      : "Not Set";

    const data = {
      title: titleInput.value,
      description: descInput ? descInput.value : "",
      time_limit: finalTimeLimit,
      venue: "TBA"
    };

    const response = await fetch("http://127.0.0.1:8000/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      alert("Failed to create event in backend");
      return;
    }

    const result = await response.json();
    const createdId = result.id; 
    
    if (createdId) {
      await saveQuestions(createdId);
    }

    localStorage.setItem("justCreatedEvent", "true");
    alert("Event Created with Questions! You will be directed to the login page.");
    
    showPage("adminHome");
    await loadEvents();
    
    customQuestions = []; 

  } catch (error) {
    console.error("Error:", error);
  }
  return false;
}

async function loadEvents() {
  let container = document.getElementById("adminEventList");
  
  const studentHomeSection = document.getElementById("studentHome");
  if (studentHomeSection && !studentHomeSection.classList.contains("hidden")) {
    container = document.getElementById("studentEventList");
  }

  if (!container) return;

  try {
    const token = localStorage.getItem("token");

    const response = await fetch("http://127.0.0.1:8000/events", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "" 
      }
    });

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status}`);
      return;
    }

    const events = await response.json();
    container.innerHTML = "";

    if (Array.isArray(events)) {
      events.forEach(item => {

        if (!item.title && !item.description) return;

        const card = document.createElement("div");
        card.className = "event-card";
        
        card.addEventListener("click", () => {
            openEventForm(item.id);
        });

        card.innerHTML = `
            <div class="event-title-badge">${item.title || "NO TITLE"}</div>
            <div class="event-details-group">
              <div class="event-time-limit">Time Limit: ${item.time_limit || "NOT SET"}</div>
              <p class="event-description-text">${item.description || "No description available."}</p>
            </div>
        `;

        container.appendChild(card);
      });
    }
  } catch (error) {
    console.error("Error loading events:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadEvents();

  document.addEventListener("input", (e) => {
    if (e.target.contains && e.target.classList.contains("q-text")) {
      updateQuestionPreview();
    }
  });
});

function updateQuestionPreview() {
  const container = document.getElementById("questionContainer");
  const preview = document.getElementById("preview-questions");
  if (!container || !preview) return;

  preview.innerHTML = "";

  container.querySelectorAll(".question-box").forEach((q, index) => {
    const text = q.querySelector(".q-text").value;
    if (text.trim() !== "") {
      const p = document.createElement("p");
      p.textContent = `${index + 1}. ${text}`;
      preview.appendChild(p);
    }
  });
}

async function openEventForm(eventId) {
    try {
        // 1. Hihilahin ang data ng event mula sa iyong FastAPI server
        const response = await fetch(`http://127.0.0.1:8000/events/${eventId}`);
        
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const event = await response.json();
        console.log("Successfully fetched event data:", event);

        // 2. Paglalagay ng Main Headers (Ginamit ang mga totoong ID mula sa HTML mo)
        const titleEl = document.getElementById("currentEventTitle");
        const timeEl = document.getElementById("currentEventTime");

        if (titleEl) titleEl.innerText = event.title || "UNTITLED EVENT";
        if (timeEl) timeEl.innerHTML = `<strong>Time Limit:</strong> ${event.time_limit || "NOT SET"}`;

        // 3. Pag-render ng mga Dynamic Input Fields sa loob ng iyong questionsContainer
        const questionsContainer = document.getElementById("questionsContainer");
        if (questionsContainer) {
            questionsContainer.innerHTML = ""; // Linisin ang lumang laman o "Loading..." tekstong natitira

            if (event.questions && event.questions.length > 0) {
                event.questions.forEach(q => {
                    const fieldWrapper = document.createElement("div");
                    fieldWrapper.className = "input-field-group"; // CSS styling class mo
                    fieldWrapper.style.marginBottom = "15px"; // Para may awang ang bawat input box
                    
                    fieldWrapper.innerHTML = `
                        <label class="form-label" style="display: block; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; text-align: left;">
                            ${q.question_text || "Field"}
                        </label>
                        <input type="text" class="form-control" name="question_${q.id || Date.now()}" required 
                               style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #f9f9f9;" />
                    `;
                    questionsContainer.appendChild(fieldWrapper);
                });
            }
        }

        // 4. PAGLIPAT NG PAGE VIEW: Gagamitin ang showPage() mo para lumipat sa form layout
        if (typeof showPage === "function") {
            showPage("studentEventFormPage"); // Itinugma sa id ng <section> mo
        } else {
            // Kung sakaling walang showPage function, gagamit ng manual fallback:
            const formPage = document.getElementById("studentEventFormPage");
            if (formPage) {
                formPage.classList.remove("hidden");
            }
        }

    } catch (err) {
        console.error("Fetch Error details:", err);
        alert("Failed to load event details.");
    }
}

// Added: Dispatches student response payloads and pulls down unique check-in QR ticket 
async function submitStudentResponse(e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return alert("Please log in first.");

    const answers = [];
    const inputs = document.querySelectorAll(".student-answer-input");
    inputs.forEach(input => {
        answers.push({
            question_id: input.getAttribute("data-question-id"),
            answer_text: input.value
        });
    });

    const payload = {
        event_id: currentActiveEventId,
        answers: answers
    };

    try {
        const res = await fetch("http://127.0.0.1:8000/responses", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json();
            return alert(errData.detail || "Failed to submit answers.");
        }

        const responseResult = await res.json();
        
        const qrDataString = JSON.stringify({
            ticket_id: responseResult.id,
            event_id: currentActiveEventId
        });

        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrDataString)}`;
        
        const qrCanvas = document.getElementById("qrcodeCanvas");
        qrCanvas.innerHTML = `<img src="${qrCodeUrl}" alt="Unique Registration QR Code" style="border: 2px solid #000; padding: 10px; background:#fff;"/>`;

        document.getElementById("dynamicStudentForm").classList.add("hidden");
        document.getElementById("qrResultContainer").classList.remove("hidden");
        
        alert("Form Submitted Successfully! Your unique QR code has been generated.");

    } catch (err) {
        console.error(err);
    }
}

// Modified: Streamlined single centralized state checker on document readiness
document.addEventListener("DOMContentLoaded", () => {
    const justCreated = localStorage.getItem("justCreatedEvent");

    if (justCreated === "true") {
        localStorage.removeItem("justCreatedEvent"); 
        if (typeof showPage === "function") showPage("adminHome");
    } else {
        loadEvents();
    }

    document.addEventListener("input", (e) => {
        if (e.target.contains && e.target.classList.contains("q-text")) {
            updateQuestionPreview();
        }
    });
});

function updateQuestionPreview() {
  const container = document.getElementById("questionContainer");
  const preview = document.getElementById("preview-questions");
  if (!container || !preview) return;

  preview.innerHTML = "";

  container.querySelectorAll(".question-box").forEach((q, index) => {
    const text = q.querySelector(".q-text").value;
    if (text.trim() !== "") {
      const p = document.createElement("p");
      p.textContent = `${index + 1}. ${text}`;
      preview.appendChild(p);
    }
  });
}

async function createAdminEvent() {
    const title = document.getElementById("adminInputTitle").value;
    const timeLimit = document.getElementById("adminInputTime").value;
    const description = document.getElementById("adminInputDesc").value;

    const questionsArray = [
        { "id": 1, "question_text": "NAME" },
        { "id": 2, "question_text": "STUDENT NUMBER" },
        { "id": 3, "question_text": "BLOCK" }
    ];

    const payload = {
        title: title,
        time_limit: timeLimit,
        description: description,
        questions: questionsArray
    };

    try {
        const response = await fetch("http://127.0.0.1:8000/events", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            alert("Event successfully created and added to Master List!");
            
            if (typeof loadAdminEvents === "function") loadAdminEvents(); 
        } else {
            const errorData = await response.json().catch(() => ({}));
        }
    } catch (err) {
        console.error("Admin Save Error:", err);
    }
}
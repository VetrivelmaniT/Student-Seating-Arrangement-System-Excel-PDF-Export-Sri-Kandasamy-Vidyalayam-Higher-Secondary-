document.addEventListener('DOMContentLoaded', function() {
    const examBtn = document.getElementById('examBtn');
    const examSection = document.getElementById('examSection');
    const uploadBtn = document.getElementById('uploadBtn');
    const excelFile = document.getElementById('excelFile');
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    const roomDetailsSection = document.getElementById('roomDetailsSection');
    const showRoom1Btn = document.getElementById('showRoom1Btn');

    let studentData = [];
    let roomAssignments = {};

    examBtn.addEventListener('click', () => {
        examSection.classList.remove('hidden');
        roomDetailsSection.classList.add('hidden');
    });

    uploadBtn.addEventListener('click', () => {
        if (excelFile.files.length === 0) {
            alert('Please select an Excel file first.');
            return;
        }

        const file = excelFile.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            studentData = XLSX.utils.sheet_to_json(worksheet);

            generateExamArrangement();
            showRoom1Btn.classList.remove('hidden');
            generatePdfBtn.classList.remove('hidden');
        };

        reader.readAsArrayBuffer(file);
    });

    function generateExamArrangement() {
        roomAssignments = {};
        const roomCapacity = 30;
        const totalRooms = Math.ceil(studentData.length / roomCapacity);

        for (let i = 0; i < totalRooms; i++) {
            const roomNumber = i + 1;
            roomAssignments[roomNumber] = [];
            
            for (let j = 0; j < roomCapacity && i * roomCapacity + j < studentData.length; j++) {
                const studentIndex = i * roomCapacity + j;
                const seatNumber = j + 1;
                let column, side;

                if (seatNumber <= 15) {
                    column = Math.ceil(seatNumber / 5);
                    side = 'left';
                } else {
                    column = Math.ceil((seatNumber - 15) / 5);
                    side = 'right';
                }

                roomAssignments[roomNumber].push({
                    student: studentData[studentIndex],
                    seatNumber: seatNumber,
                    column: column,
                    side: side
                });
            }
        }
    }

    function showRoomDetails(roomNumber) {
        roomDetailsSection.innerHTML = '';
        const roomDiv = document.createElement('div');
        roomDiv.classList.add('room-details');
        roomDiv.innerHTML = `<h2>Room ${roomNumber}</h2>`;

        const roomLayout = document.createElement('div');
        roomLayout.classList.add('room-layout');

        for (let column = 1; column <= 3; column++) {
            const columnDiv = document.createElement('div');
            columnDiv.classList.add('column');

            const leftBench = document.createElement('div');
            leftBench.classList.add('bench', 'left');
            const rightBench = document.createElement('div');
            rightBench.classList.add('bench', 'right');

            roomAssignments[roomNumber].forEach(assignment => {
                if (assignment.column === column) {
                    const seat = document.createElement('div');
                    seat.classList.add('seat');
                    seat.innerHTML = `
                        <div class="seat-number">${assignment.seatNumber}</div>
                        <div class="student-info">
                            <div>${assignment.student['Student Name']}</div>
                            <div>${assignment.student['Register Number']}</div>
                            <div>${assignment.student['Class & Section']}</div>
                        </div>
                    `;
                    if (assignment.side === 'left') {
                        leftBench.appendChild(seat);
                    } else {
                        rightBench.appendChild(seat);
                    }
                }
            });

            columnDiv.appendChild(leftBench);
            columnDiv.appendChild(rightBench);
            roomLayout.appendChild(columnDiv);
        }

        roomDiv.appendChild(roomLayout);
        roomDetailsSection.appendChild(roomDiv);
        roomDetailsSection.classList.remove('hidden');
    }

    showRoom1Btn.addEventListener('click', () => {
        showRoomDetails(1);
    });

    generatePdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text('Exam Hall Arrangement', 14, 22);
        
        doc.setFontSize(12);
        
        Object.keys(roomAssignments).forEach((roomNumber, index) => {
            if (index > 0) {
                doc.addPage();
            }
            
            doc.setFontSize(16);
            doc.text(`Room ${roomNumber}`, 14, 20);
            doc.setFontSize(10);
            
            let yPos = 30;
            
            roomAssignments[roomNumber].forEach((assignment) => {
                const studentName = assignment.student['Student Name'];
                const regNumber = assignment.student['Register Number'];
                const classSection = assignment.student['Class & Section'];
                const seatInfo = `Seat ${assignment.seatNumber} (Column ${assignment.column}, ${assignment.side})`;
                doc.text(`${seatInfo}: ${studentName} - ${regNumber} - ${classSection}`, 14, yPos);
                yPos += 7;
                
                if (yPos > 280) {
                    doc.addPage();
                    yPos = 20;
                }
            });
        });
        
        doc.save('exam_hall_arrangement.pdf');
    });
});
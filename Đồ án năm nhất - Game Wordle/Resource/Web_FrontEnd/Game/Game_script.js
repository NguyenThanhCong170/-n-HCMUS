const MAX_NUMBER_OF_ATTEMPS = 6;

const history = [];

let currentWord = '';
let point = 60;
let start = Date.now();

// Lấy word cần tìm
let select_word = '';
async function getWord() {
  const res = await fetch("/Words/select");
  select_word = (await res.text()).trim();
}
getWord();

// tạo word_list
let word_list = [];
async function loadWords() {
    const res = await fetch("/Words/valid");

    if (!res.ok){
        word_list = false;
        return;
    }
    else{
        const text = await res.text();
        word_list = text
            .split(/\r?\n/)
            .map(s => s.trim())
            .filter(Boolean);
    }
}
loadWords()

// Hàm main 
const init = () => {
    const KEYBOARD_KEYS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

    // Hàm gọi gameboard display
    const gameBoard = document.querySelector('#board');
    const keyboard = document.querySelector('#keyboard');

    generateBoard(gameBoard);
    generateBoard(keyboard, 3, 10, KEYBOARD_KEYS, true);
    // Hàm gọi khi gõ chữ
    document.addEventListener('keydown', event => onkeydown(event.key));
    keyboard.addEventListener('click', onKeyboardButtonClick);

    // Bật tắt keyboard
    const btn = document.getElementById("openclosekeyboard");
    const footer = document.getElementById("container-footer");
    btn.addEventListener("click", () =>{
        footer.hidden = !footer.hidden;
    });

    // Khi bấm nút thoát game thì lưu state
    const outBtn = document.getElementById("outgame");
    outBtn.addEventListener("click", async () => {
        // lưu state 
        const state = {
            select_word,
            history,
            currentWord,
            point,
            start,
            boardState: captureBoardState()
        };
        await SaveStateToDB(state);
        window.location.href = "/";
    });

    // Khi bấm nút resume thì quay lại game cũ
    const resumeBtn = document.getElementById("resumeGame");

    async function tryResumeFlow() {
        const saved = await LoadState();
        select_word = saved.select_word;
        point = saved.point;
        start = saved.start;

        history.length = 0;
        (saved.history || []).forEach(x => history.push(x));

        currentWord = saved.currentWord || "";


        restoreBoardState(saved.boardState);


        resumeBtn.classList.remove("is-disabled");
        }

    resumeBtn.addEventListener("click", tryResumeFlow);

}


// tạo tin nhắn thông báo
const ShowMessage = (message) => {
    const instruct = document.createElement('li');
    instruct.textContent = message;
    instruct.className = 'instruct';

    document.querySelector('#instruction ul').prepend(instruct);

    setTimeout(() => instruct.remove(), 1500);
}

// Xử lý UI khi thắng hay thua
async function finishGame(result, point) {
    const seconds = (Date.now()-start)/1000;
    await fetch("/point", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ point, seconds })
    });
    console.log(seconds);
    await DeleteSavedState();
    setTimeout(() => {
        window.location.href = `/GoFinishing?result=${encodeURIComponent(result)}`;
    }, 2200);
}

// kiểm tra từ 
const checkGuess = (guess, word) => {
    const guessLetters = guess.split('');
    const wordLetters = word.split('');
    const remainingWordLetters = [];
    const remainingGuessLetters = [];
    
    // đếm số từ đúng, nếu số từ đúng là 5 thì là thắng
    let count_valid_letter = 0;

    // tìm dòng hiện tại
    const currentRow = document.querySelector(`#board ul[data-row = '${history.length}']`)

    // lấy các từ trong các cột và để mặc định data-status là none
    currentRow.querySelectorAll('li').forEach((Element, index) => {
        Element.setAttribute('data-status','none');
        Element.setAttribute('data-animation','flip');

        Element.style.animationDelay = `${index*300}ms`;
        Element.style.transitionDelay = `${index*400}ms`;
    });
    
    // xử lý các từ trong các cột
    wordLetters.forEach((letter,index) => {
        // tìm các từ hợp lệ và đúng vị trí thì data-status là valid
        if (guessLetters[index] === letter){
            currentRow
                .querySelector(`li:nth-child(${index+1})`)
                .setAttribute('data-status','valid');
            
            remainingWordLetters.push(false);
            remainingGuessLetters.push(false);

            count_valid_letter += 1;
        }
        // Nếu không đúng vị trí thì push vào remaining và xử lý sau
        else{
            remainingWordLetters.push(letter);
            remainingGuessLetters.push(guessLetters[index]);
        }
    });

    // Xử lý các từ không đúng vị trí
    remainingWordLetters.forEach((letter,index) => {
        // Nếu từ = false, tức là từ này đúng hợp lệ và đúng vị trí nên không làm gì
        if (letter === false) return;

        // Nếu chữ cái có trong select_word thì data-status là invalid
        if (remainingGuessLetters.indexOf(letter) !== -1){
            currentRow
                .querySelector(`li:nth-child(${index + 1})`)
                .setAttribute('data-status', 'invalid');
        }
    });

    

    history.push(currentWord);
    currentWord = '';
    point -= 10;
    // Nếu count_valid_letter = 5 thì là thắng
    if (count_valid_letter === 5) {
        point +=10
        finishGame("thắng", point);
    }
    else if (history.length >= MAX_NUMBER_OF_ATTEMPS){
        finishGame("thua", point);
    };
};

// khởi tạo gameboard 
const BACKSPACE_KEY = 'Backspace';
const ENTER_KEY = 'Enter';
const generateBoard = (board, rows = 6, columns = 5, keys = [], keyboard = false) => {
    // Tạo các dòng, mỗi dòng sẽ có ul để chứa các cột, mỗi cột là li
    // Các dòng sẽ có tính năng 'data-row' để biết đang ở row nào
    // Các cột sẽ có 'data-status' để biết xem đã có chữ trong ô chưa
    for (let row = 0; row < rows; ++row){
        const elmRow = document.createElement('ul');
        elmRow.setAttribute('data-row', row);

        for (let column = 0; column < columns; ++column){
            const elmColumn = document.createElement('li');
            elmColumn.setAttribute('data-status', 'empty');
            elmColumn.setAttribute
            ('data-animation', 'idle');

            if (keyboard && keys.length > 0) {
                const key = keys[row].charAt(column);
                elmColumn.textContent = key;
                elmColumn.setAttribute('data-key', key);
            } 

            if (keyboard && elmColumn.textContent === '') continue;

            elmRow.appendChild(elmColumn);
        }
        
        board.appendChild(elmRow);
    }
    if (keyboard) {
        const enterKey = document.createElement('li');
        enterKey.setAttribute('data-key', ENTER_KEY);
        enterKey.textContent = ENTER_KEY;
        board.lastChild.prepend(enterKey);

        const backspaceKey = document.createElement('li');
        backspaceKey.setAttribute('data-key', BACKSPACE_KEY);
        backspaceKey.textContent = BACKSPACE_KEY;
        board.lastChild.append(backspaceKey);
    }
}

const onKeyboardButtonClick = (event) => {
  if (event.target.nodeName === 'LI') {
    onkeydown(event.target.getAttribute('data-key'));
  }
}

const onkeydown = (key) => {

    // Kiểm tra nếu đã hoàn thành 6 lượt
    if (history.length >= MAX_NUMBER_OF_ATTEMPS){
        setTimeout(() => window.location.href = "/GoFinishing?result=thua", 2200);
    };

    // Lấy row
    const currentRow = document.querySelector(`#board ul[data-row = '${history.length}']`);

    // Lấy column
    let targetColumn = currentRow.querySelector('[data-status="empty"]');


    // Xóa
    if (key === "Backspace"){
        if (targetColumn === null){
            targetColumn = currentRow.querySelector('li:last-child');
        }
        else{
            targetColumn = targetColumn.previousElementSibling ?? targetColumn;
        }
        targetColumn.textContent = '';
        targetColumn.setAttribute('data-status','empty');
        currentWord = currentWord.slice(0,-1);
        return;
    }

    if (key === "Enter"){
        if (currentWord.length < 5){      
            ShowMessage('Cần phải nhập đủ 5 chữ');
            return
        }
        
        // Check tiếng việt
        if (currentWord.length === 5 && word_list === false){
            checkGuess(select_word,currentWord);
        }
        // Check tiếng anh
        else{ 
            if(currentWord.length === 5 && word_list.includes(currentWord)){
                checkGuess(select_word,currentWord);
            }
            else{
                currentRow.setAttribute('data-animation','invalid');
                ShowMessage('Từ không tồn tại');
            }
        }
        return;
    }

    // Kiểm tra nếu đã điền vào 5 từ
    if (currentWord.length >= 5) return;
        

    // Điền từ vào ô 
    const upperCaseLetter = key.toUpperCase();
    if (/^[A-Z]$/.test(upperCaseLetter)){
        currentWord += upperCaseLetter.toLowerCase();
        targetColumn.textContent = upperCaseLetter;
        targetColumn.setAttribute('data-status', 'filled');
        targetColumn.setAttribute('data-animation','pop');
    }
}

// Lấy trạng thái game từ db
async function LoadState() {
  const res = await fetch("/game/state");
  const data = await res.json();
  return data.state;
}

// Lưu trạng thái game vào db
async function SaveStateToDB(state) {
  await fetch("/game/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state)
  });
}

// Xóa trạng thái game 
async function DeleteSavedState() {
  await fetch("/game/state", { method: "DELETE" });
}

// Hiển thị lại trạng thái game (có AI hỗ trợ code đoạn này)
function captureBoardState() {
  const rows = [...document.querySelectorAll("#board ul[data-row]")];
  return rows.map(row => {
    const cells = [...row.querySelectorAll("li")];
    return cells.map(c => ({
      t: c.textContent || "",
      s: c.getAttribute("data-status") || "empty"
    }));
  });
}

function restoreBoardState(boardState) {
  boardState.forEach((row, rIdx) => {
    const rowElm = document.querySelector(`#board ul[data-row='${rIdx}']`);
    const cells = [...rowElm.querySelectorAll("li")];
    row.forEach((cell, cIdx) => {
      if (!cells[cIdx]) return;
      cells[cIdx].textContent = cell.t || "";
      cells[cIdx].setAttribute("data-status", cell.s || "empty");
      cells[cIdx].setAttribute("data-animation", "idle");
    //   cells[cIdx].style.animationDelay = "";
    //   cells[cIdx].style.transitionDelay = "";
    });
  });
}


document.addEventListener("DOMContentLoaded",init);
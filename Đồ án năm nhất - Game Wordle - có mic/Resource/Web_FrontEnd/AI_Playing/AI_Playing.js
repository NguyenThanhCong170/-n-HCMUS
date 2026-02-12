const MAX_NUMBER_OF_ATTEMPS = 6;

const history = [];

let currentWord = '';
let point = 60;
const start = Date.now()
//Các từ cần loại bỏ trong các lần dự đoán không thành công
let word_needed_erased = []

// Lấy word cần tìm
let select_word = '';
async function getWord() {
  const res = await fetch("/Words/AI/select");
  select_word = (await res.text()).trim();
  console.log(select_word);
}
getWord();


// Hàm main 
const init = () => {
    // Hàm gọi gameboard display
    const gameBoard = document.querySelector('#board');
    generateBoard(gameBoard);

    // Hàm gọi khi gõ chữ
    const word = window.AI_WORD;
    AutoType(word);
}

// Xử lý UI khi thắng hay thua
async function finishGame(result, point) {
    const seconds = (Date.now()-start)/1000;
    await fetch("/AIPoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ point, seconds})
    });
    setTimeout(() => {
        window.location.href = `/AIGoFinishing?result=${encodeURIComponent(result)}`;
    }, 2200);
}


// Trả remainingWordLetters về flask AI để xử lý
async function Return_Element(remainingWordLetters, currentWord, word_needed_erased){
    console.log(remainingWordLetters, currentWord)
    const res = await fetch("/AI_Choose_Word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            remainingWordLetters: remainingWordLetters,
            currentWord: currentWord,
            word_needed_erased: word_needed_erased        
        })
    });

    const data = await res.json();
    return data;
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
                remainingWordLetters[index] = "invalid";
                remainingGuessLetters[remainingGuessLetters.indexOf(letter)] = "invalid";
        }
    });

    point -= 10;
    // Nếu count_valid_letter = 5 thì là thắng
    if (count_valid_letter === 5) {
        point +=10
        finishGame("thắng", point);
    }
    else if (history.length >= MAX_NUMBER_OF_ATTEMPS){
        finishGame("thua", point);
    };
    word_needed_erased.push(currentWord);
    Return_Element(remainingWordLetters, currentWord, word_needed_erased).then((data) => {
        setTimeout(() => AutoType(data.next_word),2200);
    })

    history.push(currentWord);
    currentWord = '';
};

// khởi tạo gameboard 
const generateBoard = (board, rows = 6, columns = 5) => {
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
            elmRow.appendChild(elmColumn);
        }

        board.appendChild(elmRow);
    }
}

// AI Tự gõ chữ
async function AutoType(word){
    for (const ch of word){
        onkeydown(ch);
        await new Promise(r => setTimeout(r,500))
    }
    onkeydown("Enter");
}

const onkeydown = (key) => {

    // Kiểm tra nếu đã hoàn thành 6 lượt
    if (history.length >= MAX_NUMBER_OF_ATTEMPS){
        finishGame("thua", 0);
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
        if (currentWord.length === 5){
            checkGuess(select_word,currentWord);
        }
        else{
            currentRow.setAttribute('data-animation','invalid');
            ShowMessage('Từ không tồn tại');
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



document.addEventListener("DOMContentLoaded",init);
const body = document.querySelector("#boardBody")

const data = [
    
  ];

data.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.ten}</td>
        <td>${item.diem}</td>
    `;
    body.appendChild(tr);
});
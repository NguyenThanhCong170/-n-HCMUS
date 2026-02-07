# Phân loại độ khó của từ vựng tiếng Anh

from wordfreq import zipf_frequency
import os

link_raw_data = "Word/English/origin_txt/en_5words.txt"
word_list = []

with open(link_raw_data,"r") as f:
    for word in f:
        word_list.append(word.strip())


# Phân loại độ khó

Thresh_hold_easy = 4.0
Thresh_hold_medium = 2.5


word_easy = []
word_medium = []
word_hard = [] 

for word in word_list:
    freq = zipf_frequency(word, 'en') # tính độ khó của từ, từ càng khó thì có freq càng thấp

    if freq >= Thresh_hold_easy: 
        word_easy.append(word)
    elif freq >= Thresh_hold_medium:
        word_medium.append(word)
    else:
        word_hard.append(word)


# lưu file.txt cho từng độ khó của chữ

print(len(word_easy),len(word_medium),len(word_hard))

with open("word_easy.txt","w") as f:
    f.write("\n".join(word_easy))

with open("word_medium.txt", "w") as f:
    f.write("\n".join(word_medium))

with open("word_hard.txt", "w") as f:
    f.write("\n".join(word_hard))
    

import csv
import numpy as np
import pickle
from nltk.stem import WordNetLemmatizer

lemmatizer = WordNetLemmatizer()

def vectorize(path, limit=20000, lemma_only=False, pkl=False, pklpath='vector.pkl'):
    with open(path, encoding='utf-8') as f:
        reader = csv.reader(f, delimiter=' ', quoting=csv.QUOTE_NONE)
        arr = np.array([line for line in reader if (not lemma_only) or lemmatizer.lemmatize(line[0]) == line[0]])
        index_to_word = arr[:, 0]
        word_to_index = { w: i for i, w in enumerate(list(arr[:, 0].T)) }
        vec = arr[:, 1:].astype('float')

    if pkl:
        with open(pklpath, 'wb') as f:
            pickle.dump((index_to_word, word_to_index, vec), f)

    return index_to_word, word_to_index, vec
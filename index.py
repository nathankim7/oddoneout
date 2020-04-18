from flask import Flask, request, jsonify, Response, render_template
from annoy import AnnoyIndex
import numpy as np
from vectorize import vectorize
import pickle
import math
import random
from nltk.stem import PorterStemmer
import os

INIT = False
pklpath = 'glove.6B.100d.pkl'
stemmer = PorterStemmer()

if (INIT):
    index_to_word, word_to_index, vec = vectorize('glove.6B.50d.txt', limit=20000, lemma_only=True, pkl=True, pklpath=pklpath)
else:
    with open(pklpath, 'rb') as f:
        (index_to_word, word_to_index, vec) = pickle.load(f)

vec = vec[:5001]
print('embeddings loaded!')
a = AnnoyIndex(vec.shape[1], 'angular')

for i in range(vec.shape[0]):
    a.add_item(i, vec[i])

a.build(30)

print('ann built!')

def cos(u, v):
    return np.dot(u, v) / (math.sqrt(np.dot(u, u)) * math.sqrt(np.dot(v, v)))

def generate_ann(length, outlier_dist=100, start=None):
    if start == None:
        start = random.randrange(0, vec.shape[0])

    candidates = a.get_nns_by_item(start, outlier_dist, include_distances=True)
    candidates = [index_to_word[i] for i in candidates[0]]
    result = candidates[:(length - 1)]
    result.append(candidates[outlier_dist - 1])
    return result

def generate_centroid(length, outlier_dist=100, start=None):
    if start == None:
        start = random.randrange(0, vec.shape[0])

    candidates = a.get_nns_by_item(start, outlier_dist)
    result = [candidates[0]]
    stems = [stemmer.stem(index_to_word[candidates[0]])]
    vecs = np.zeros((length - 1, vec.shape[1]))
    vecs[0] = vec[candidates[0]]

    for i in range(1, length - 1):
        centroid = vecs.sum(axis=0) / (i + 1)
        maxi = 0
        maxind = 0

        for j in range(vec.shape[0]):
            if (j not in result) and (stemmer.stem(index_to_word[j]) not in stems):
                sim = cos(centroid, vec[j])

                if sim > maxi:
                    maxi = sim
                    maxind = j
        
        vecs[i] = vec[maxind]
        result.append(maxind)
        stems.append(stemmer.stem(index_to_word[maxind]))

    result.append(candidates[outlier_dist - 1])
    return [index_to_word[i] for i in result]

# inp = input()

# while inp != 'quit':
#     print(generate_ann(5))
#     inp = input()

app = Flask(__name__, static_folder='static')

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/generate', methods=['GET'])
def generate():
    generator = request.args.get('generator')
    length = int(request.args.get('length'))
    dist = int(request.args.get('dist'))

    if generator == 'ann':
        return jsonify(generate_ann(length, outlier_dist=dist))
    elif generator == 'centroid':
        return jsonify(generate_centroid(length, outlier_dist=dist))
    else:
        return Response(status=400)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 8080)), debug=True)
# Odd-One-Out Generator

Anyone who's ever had to sit through an aptitude test can probably remember something like the following:

**Q: Pick the odd one out.***

1. Apple
2. Pear
3. Pie
4. Orange
5. Lemon

If that question left you feeling stumped, well, do I have the tool for you! This script will allow the user to generate as many example questions as their heart desires, making for hours upon hours of solid practice.

<sub>*It's 3.</sub>

## Data + Preprocessing

In its current form, the script uses the 100-dimensional vector from the 6B-token pre-trained vector set distributed by [the creators of GloVe](https://nlp.stanford.edu/projects/glove/). These data come in text files where each line consists of a single tokens followed by the space-separated values in its word vector. At present, only the first 5000 tokens are sampled from this dataset.

For this script, each token was indexed according to its line number in the file and preprocessed into three data structures: `index_to_word`, a Numpy array where each element corresponds to the token at that index; `word_to_index`, a Python dictionary corresponding tokens to their indices; and `vec`, a Numpy matrix containing the actual word vectors as rows. At the moment, I am trying to figure out a memory-efficient way of removing inflected words from the dataset (e.g. *dogs*, *brought*) during the preprocessing step, but so far none of the main script relies on anything like that.

## Methodology

Each question consists of *n* words, generated from a single root word: *n - 1* words (including the root word) in the similar set, which are fairly close substitutes in meaning for the root word, and one outlier, which is (adjustably) farther. The similar set can be generated in two ways:

### Similar Set Generation

The first and significantly faster option is to use an approximate nearest neighbours (ANN) tree provided by the Annoy library; in this case the similar set consists of the *n - 2* nearest neighbours to the root word. However, since in this method candidacy for the similar set depends on similarity to the root word alone, the following situation is prone to occur, where two words share no similarity other than through the root word:

```raw
  Shakespeare (root)
   /       \
England   Romeo
```

The other option is what I have designated as the 'centroid' method, and avoids this issue at a significant cost to performance. In this method, the similar set is generated by repeating the following procedure until all *n - 1* words have been added:

1. Compute the centroid of all current words in the similar set.
2. Find the nearest neighbour to the similar set centroid using brute force iteration, and add that token to the similar set.

The effect of this method is to ensure that all words currently in the set, and not just the root word, influence the selection of the next word, resulting in sets that more closely coalesce around a common theme. With an *O(n<sup>2</sup>)* time complexity, however, this method is currently capped at searching only the 5000 most common words. I'm sure there must be a way to achieve this without brute force... if you have a better way, please let me know!

### Outlier Generation

The outlier is generated using a value designated as the *outlier distance*, or *d*. It is generated as the *d*'th nearest neighbour to the root word, meaning that higher values of *d* will create outliers that are more conspicuously different from the similar set (and therefore easier questions), while lower values of *d* will do the opposite.

### Outlier Detection

The site can detect outliers using the cluster prototype method introduced by [Santus et. al](https://www.aclweb.org/anthology/P18-2088/): for each word, the similarity between itself and the centroid of the other word vectors in the set is calculated, and the word with the lowest such similarity is determined to be the outlier.

## Next Steps

* Explore better similarity metrics, i.e. the APSynP metric introduced by [Santus et. al](https://www.aclweb.org/anthology/P18-2088/).

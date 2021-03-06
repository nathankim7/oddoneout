import React from 'react'
import ReactDOM from 'react-dom'
import classNames from 'classnames'
import Chart from 'chart.js'

Chart.defaults.global.defaultFontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, 'Open Sans', 'Helvetica Neue', sans-serif";
Chart.defaults.global.defaultFontSize = 16;

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mode: 0,
            words: [],
            sim: [],
            errors: [],
            root: 0,
            submitted: false,
            outlier: -1,
            selected: -1,
            generator: 'centroid',
            length: 5,
            dist: 75,
            start: '',
            options: false
        }

        this.chartRef = React.createRef();
    }

    shuffle = arr => {
        let res = [...arr];

        for (let i = 0; i < arr.length - 1; i++) {
            let j = i + Math.floor(Math.random() * (arr.length - i));
            let temp = res[i]; res[i] = res[j]; res[j] = temp;
        }

        return res;
    }

    fetchWords = async () => {
        var res = await fetch(`/generate?generator=${this.state.generator}&length=${this.state.length}&dist=${this.state.dist}&start=${this.state.start}`);
        
        if (!res.ok)
            return;

        var json = await res.json();
        var shuffled = this.shuffle(json.tokens);

        this.setState({ 
            words: shuffled, 
            root: shuffled.indexOf(json.tokens[0]), 
            outlier: shuffled.indexOf(json.tokens[this.state.length - 1]),
            submitted: false 
        });

        this.draw(json.tokens, json.sim, this.state.length - 1);
    }

    fetchSolve = async () => {
        let res = await fetch('/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'tokens': this.state.words })
        });

        if (!res.ok) 
            return false;

        let json = await res.json();

        if (json.errors) {
            this.setState({ errors: json.errors, submitted: true });
            return false;
        }

        this.setState({
            outlier: this.state.words.indexOf(json.outlier),
            submitted: true
        });

        let arr = [this.state.words, json.sim];
        arr = arr[0].map((_, c) => arr.map(r => r[c]));
        arr.sort((a, b) => b[1] - a[1]);
        let tokensSorted = arr.map(x => x[0]), simSorted = arr.map(x => x[1]);

        this.draw(tokensSorted, simSorted, tokensSorted.indexOf(json.outlier));
        return true;
    }

    draw = (labels, data, outlier) => {
        let barColours = Array(labels.length).fill('rgba(0, 0, 0, 0.2)');
        barColours[outlier] = 'rgba(25, 169, 116, 0.5)';

        this.state.chart.data.labels = labels;
        this.state.chart.data.datasets[0].data = data;
        this.state.chart.data.datasets[0].backgroundColor = barColours;
        this.state.chart.update();
    }

    componentDidMount() {
        var chart = new Chart(this.chartRef.current, {
            type: 'horizontalBar',
            data: {
                labels: [],
                datasets: [{
                    data: []
                }]
            },
            options: { 
                legend: { display: false },
                scales: { xAxes: [{ 
                    ticks: { beginAtZero: true },
                    scaleLabel: { display: true, labelString: 'Cluster Similarity' },
                    position: 'top'
                }]} 
            }
        });

        this.setState({ chart: chart });
    }

    switchMode = mode => {
        this.setState({ mode: mode, words: [], outlier: -1, submitted: false, options: false })
    }

    handleChange = event => {
        this.setState({ [event.target.name]: event.target.value })
    }

    render() {
        const choices = this.state.words.map((word, idx) => {
            var wordClass = classNames('ba bw1 br-pill pv2 ph3 mh2 mv2 dim', {
                "b--light-gray light-gray": this.state.submitted && idx != this.state.selected && idx != this.state.outlier,
                "b--mid-gray mid-gray": !this.state.submitted,
                "b--green green": this.state.submitted && idx == this.state.outlier,
                "b--light-red light-red": this.state.submitted && this.state.selected != this.state.outlier && idx == this.state.selected
            })

            return (
                <p style={{ userSelect: 'none' }} 
                    className={wordClass} 
                    onClick={() => this.setState({ submitted: true, selected: idx })}>
                    {word}
                </p>
            )
        })

        const inputs = this.state.words.map((word, idx) => {
            var css = classNames('pa1 ma0 mt3', {
                'black-40': idx != this.state.outlier,
                'green': idx == this.state.outlier,
                'red': this.state.errors.includes(word)
            })

            return (<p style={{ userSelect: 'none' }} className={css}>{word}</p>)
        });

        return (
            <div className="flex flex-column items-center w-90 w-40-ns">
                <div className="flex flex-row justify-center w-100">
                    <div style={{ maxWidth: '50%' }} className="flex-auto items-center">
                        <div style={{ userSelect: 'none', borderWidth: '.15rem' }}
                            className={classNames("b f4 pa2 tc black-60 w-auto dim", { 'bb bw2': this.state.mode == 0 })}
                            onClick={() => this.switchMode(0)}>
                            Generate
                        </div>
                    </div>
                    <div style={{ maxWidth: '50%' }} className="flex-auto items-center">
                        <div style={{ userSelect: 'none', borderWidth: '.15rem' }}
                            className={classNames("b f4 pa2 tc black-60 dim", { 'bb bw2': this.state.mode == 1 })}
                            onClick={() => this.switchMode(1)}>
                            Solve
                        </div>
                    </div>
                </div>
                {this.state.mode == 0 ? 
                <div className="w-100">
                    <div className="flex flex-row w-100 pv3 ph2">
                        <div className="b black-60 flex flex-auto f4">Options</div>
                        <button onClick={() => this.setState({ options: !this.state.options })} className="bn black-60 bg-white outline-0">{this.state.options ? '-' : '+'}</button>
                    </div>
                    <form className="flex flex-column items-center w-100" onSubmit={(e) => { this.fetchWords(); e.preventDefault(); }}>
                        {this.state.options && 
                        <div className="flex-column items-center w-100">
                            <div className="flex flex-column w-100 mb3 pa2 bg-black-20 bn br3">
                                <div className="flex-auto items-center b mid-gray">Generator:</div>
                                <div className="w-100 mv1 flex flex-row items-center">
                                    <label className="items-center mid-gray">Centroid</label>
                                    <input type="radio" 
                                        value="centroid"
                                        name="generator" 
                                        checked={this.state.generator == 'centroid'}
                                        onChange={this.handleChange}
                                        className="mh2"/>
                                    <label className="items-center mid-gray">ANN</label>
                                    <input type="radio" 
                                        value="ann"
                                        name="generator" 
                                        checked={this.state.generator == 'ann'}
                                        onChange={this.handleChange}
                                        className="mh2"/>
                                </div>
                                <div className="i black-30">The method used to generate the set of similar words. The centroid method generates iteratively, filling in the set by repeatedly choosing the nearest unchosen token to the centroid of all the tokens currently in the set. It maintains a high degree of similarity between the words in the set,albeit at a significant cost to performance; as such, this method only draws from the <p className="b i di black-30">5000 most common words</p>.<br/><br/>The ANN method selects the similar set as the (n - 1) approximate nearest neighbours to a given root word in an ANN tree; while this method is significantly more performant, the sets it generates diverge considerably more in their meanings, sometimes resulting in obscure/unsolvable questions.</div>
                            </div>
                            <div className="flex flex-column w-100 mb3 pa2 bg-black-20 bn br3">
                                <div className="w-100 mb1 flex flex-row items-center">
                                    <label for="length" className="flex-auto items-center b mid-gray">Number of choices:</label>
                                    <input type="text" 
                                        id="length"
                                        value={this.state.length} 
                                        name="length" 
                                        onChange={this.handleChange}
                                        style={{ maxWidth: '40%', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
                                        className="flex-none bn br-pill b--black-20 pv1 ml2 outline-0 black-20" />
                                </div>
                                <div className="i black-30">The number of words generated by the script. Only one outlier will always be generated.</div>
                            </div>
                            <div className="flex flex-column w-100 mb3 pa2 bg-black-20 bn br3">
                                <div className="w-100 mb1 flex flex-row items-center">
                                    <label for="dist" className="flex-auto items-center b mid-gray">Outlier distance: </label>
                                    <input type="text" 
                                        id="dist"
                                        value={this.state.dist} 
                                        name="dist" 
                                        onChange={this.handleChange}
                                        style={{ maxWidth: '40%', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
                                        className="flex-none bn br-pill b--black-20 pv1 ml2 outline-0 black-20" />
                                </div>
                                <div className="i black-30">For a distance value n, the outlier is generated as the n'th nearest neighbour to the root word. Higher values will result in easier questions, as the outlier is further in meaning from the root word, and lower values will similarly result in easier questions.</div>
                            </div>
                            <div className="flex flex-column w-100 mv2 pa2 bg-black-20 bn br3">
                                <div className="w-100 mb1 flex flex-row items-center">
                                    <label for="start" className="flex-auto items-center b mid-gray">Root word: </label>
                                    <input type="text" 
                                        id="start"
                                        value={this.state.start} 
                                        name="start" 
                                        onChange={this.handleChange}
                                        style={{ maxWidth: '40%', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
                                        className="flex-none bn br-pill b--black-20 pv1 ml2 outline-0 black-20" />
                                </div>
                                <div className="i black-30">The root word of the set; the similar words and outlier are selected with respect to this word. The same root word should always generate the same similar and outlier words. If left blank, a random root word will be selected.</div>
                            </div>
                        </div>}
                        <input type="submit" className="bn f5 dim br3 pa2 mv3 white bg-light-red" value="Generate!" />
                    </form>
                    <div className="flex flex-row flex-wrap justify-center">{choices}</div>
                </div> : // generate ends here
                <div className="w-100 flex flex-column items-center">
                    <input type="text" 
                        id="input"
                        placeholder="any word..."
                        name="input" 
                        onKeyUp={(e) => {
                            if (e.keyCode == 13) {
                                if (this.state.submitted)
                                    this.setState({ words: [e.target.value], submitted: false, outlier: -1, errors: [] })
                                else
                                    this.setState({ words: [...this.state.words, e.target.value] })

                                e.target.value = '';
                            }
                        }}
                        style={{ maxWidth: '40%', border: 0, borderBottom: '.2rem solid #777' }}
                        className="f4 ph3 pt3 pb2 mid-gray outline-0 tc"/>
                    <div className="flex flex-row flex-wrap justify-center">{inputs}</div>
                    {this.state.errors.length > 0 && 
                    <p className="light-red i ma0 mt3">One or more of your words is not in the system vocabulary.</p>}
                    <button 
                        className="bn f4 dim br3 pa2 mv3 white bg-light-red" 
                        onClick={async () => {
                            let ok = await this.fetchSolve();

                            if (ok)
                                this.setState({ submitted: true });
                        }}>
                        Solve!
                    </button>
                    {(!this.state.submitted || this.state.errors.length > 0) &&
                    <div className="w-100 mb5">
                        <p className="w-100 i black-40 tc mb2 mt0 lh-copy">Enter as many words as you like, then press Solve! The outlier will be highlighted in green. Entering a new word after a list has been solved will clear the current list.</p>
                        <div>
                            <p className="w-100 i black-40 mv1">Some examples:</p>
                            <ul className="i black-40 mv1 lh-copy">
                                <li>Geography: Beijing, Shanghai, Tokyo, Seoul, Toronto</li>
                                <li>Number sense: 13, 12, 15, 18, 37</li>
                                <li>Domain knowledge: Merrill, Goldman, Chase, Phillips</li>
                            </ul>
                        </div>
                    </div>}
                </div>}
                <div className={classNames('w-100 pa2 bg-black-20 bn br3 mv3', { 'dn': !this.state.submitted || this.state.errors.length > 0 })}>
                    <div className="relative w-100 pr1">
                        <canvas ref={this.chartRef}></canvas>
                    </div>
                    <p className="i black-30 ma1">A word's cluster similarity is its cosine similarity with the average of the other word vectors in the set. It is a measure of the extent to which the word 'fits in' with the others; a lower score means a greater likelihood of being the outlier.</p>
                </div>
                
            </div>
        );
    }
}

ReactDOM.render(<App />, document.querySelector('#container'))
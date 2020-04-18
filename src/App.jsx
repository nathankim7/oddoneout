import React from 'react'
import ReactDOM from 'react-dom'
import classNames from 'classnames'

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            words: [],
            root: 0,
            answered: false,
            outlier: -1,
            selected: -1,
            generator: 'centroid',
            length: 5,
            dist: 75,
            options: false
        }
    }

    shuffle = arr => {
        let res = [...arr];

        for (let i = 0; i < arr.length - 1; i++) {
            let j = i + Math.floor(Math.random() * (arr.length - i));
            let temp = res[i]; res[i] = res[j]; res[j] = temp;
        }

        return res;
    }

    choose = index => {
        this.setState({ answered: true, selected: index })
    }

    fetchWords = async () => {
        let res = await fetch('/generate?generator=' + this.state.generator + '&length=' + this.state.length + '&dist=' + this.state.dist);
        let arr = await res.json();
        let shuffled = this.shuffle(arr);

        this.setState({ 
            words: shuffled, 
            root: shuffled.indexOf(arr[0]), 
            outlier: shuffled.indexOf(arr[this.state.length - 1]),
            answered: false 
        });
        console.log(this.state);
    }

    handleSubmit = event => {
        this.fetchWords();
        event.preventDefault();
    } 

    handleChange = event => {
        this.setState({ [event.target.name]: event.target.value })
    }

    toggleOptions = () => {
        this.setState({ options: !this.state.options })
    }

    render() {
        const choices = this.state.words.map((word, idx) => {
            var wordClass = classNames('ba bw1 br-pill pv2 ph3 mh2 mv2 dim', {
                "b--light-gray light-gray": this.state.answered && idx != this.state.selected && idx != this.state.outlier,
                "b--mid-gray mid-gray": !this.state.answered,
                "b--green green": this.state.answered && idx == this.state.outlier,
                "b--light-red light-red": this.state.answered && this.state.selected != this.state.outlier && idx == this.state.selected
            })

            return (<p style={{ userSelect: 'none' }} className={wordClass} onClick={() => this.choose(idx)}>{word}</p>)
        })

        return (
            <div className="flex flex-column items-center w-90 w-40-ns">
                <div className="flex flex-row w-100 pa2">
                    <div className="b black-40 flex flex-auto f4">Options</div>
                    <button onClick={this.toggleOptions} className="bn black-40 bg-white outline-0">{this.state.options ? '-' : '+'}</button>
                </div>
                <hr style={{ borderWidth: '.075rem' }} className="w-100 ba br-pill black-30 mb3"/>
                <form className="flex flex-column items-center" onSubmit={(e) => this.handleSubmit(e)}>
                    <div className={classNames("flex-column items-center", { 'dn': !this.state.options, 'flex': this.state.options })}>
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
                            <div className="i black-30">The method used to generate the set of similar words. At each iteration, the centroid method selects the next word for the similar set as the nearest neighbour to the centroid of the current set, and maintains a high degree of similarity between the words in the set (albeit at a significant cost to performance). The ANN method selects the similar set as the (n - 1) approximate nearest neighbours to a given root word in an ANN tree; while this method is significantly more performant, the sets it generates diverge considerably more in their meanings, sometimes resulting in obscure/unsolvable questions.</div>
                        </div>
                        <div className="flex flex-column w-100 mb3 pa2 bg-black-20 bn br3">
                            <div className="w-100 mb1 flex flex-row items-center">
                                <label for="length" className="flex-auto items-center b mid-gray">Number of choices:</label>
                                <input type="text" 
                                    id="length"
                                    value={this.state.length} 
                                    name="length" 
                                    onChange={(e) => this.handleChange(e)}
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
                                    onChange={(e) => this.handleChange(e)}
                                    style={{ maxWidth: '40%', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
                                    className="flex-none bn br-pill b--black-20 pv1 ml2 outline-0 black-20" />
                            </div>
                            <div className="i black-30">For a distance value n, the outlier is generated as the n'th nearest neighbour to the root word. Higher values will result in easier questions, as the outlier is further in meaning from the root word, and lower values will similarly result in easier questions.</div>
                        </div>
                    </div>
                    <input type="submit" className="bn f5 dim br3 pa2 mb3 white bg-light-red" value="Generate!" />
                </form>
                <div className="flex flex-row flex-wrap justify-center">{choices}</div>
            </div>
        );
    }
}

// <button className="bn f5 dim br3 pa2 mb3 white bg-light-red" onClick={() => this.fetchWords('centroid', 5)}>Generate!</button>
ReactDOM.render(<App />, document.querySelector('#container'))
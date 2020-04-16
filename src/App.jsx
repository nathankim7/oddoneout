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
            dist: 75
        }
    }

    shuffle = (arr) => {
        let res = [...arr];

        for (let i = 0; i < arr.length - 1; i++) {
            let j = i + Math.floor(Math.random() * (arr.length - i));
            let temp = res[i]; res[i] = res[j]; res[j] = temp;
        }

        return res;
    }

    choose = (index) => {
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
            <div className="flex flex-column items-center w-100 w-50-ns">
                <form className="flex flex-column items-center" onSubmit={(e) => this.handleSubmit(e)}>
                    <div className="w-100 mb2 flex flex-row items-center">
                        <label for="length" className="flex-auto items-center">Number of options:</label>
                        <input type="text" 
                            id="length"
                            value={this.state.length} 
                            name="length" 
                            onChange={(e) => this.handleChange(e)}
                            style={{ maxWidth: '40%', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
                            className="flex-none ba bw1 br-pill b--black-20 pv1 ml2 outline-0 black-20" />
                    </div>
                    <div className="w-100 mb3 flex flex-row items-center">
                        <label for="dist" className="flex-auto items-center">Outlier distance: </label>
                        <input type="text" 
                            id="dist"
                            value={this.state.dist} 
                            name="dist" 
                            onChange={(e) => this.handleChange(e)}
                            style={{ maxWidth: '40%', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
                            className="flex-none ba bw1 br-pill b--black-20 pv1 ml2 outline-0 black-20" />
                    </div>
                    <input type="submit" className="bn f5 dim br3 pa2 mb3 mt2 white bg-light-red" value="Generate!" />
                </form>
                <div className="flex flex-row flex-wrap justify-center">{choices}</div>
            </div>
        );
    }
}

// <button className="bn f5 dim br3 pa2 mb3 white bg-light-red" onClick={() => this.fetchWords('centroid', 5)}>Generate!</button>
ReactDOM.render(<App />, document.querySelector('#container'))
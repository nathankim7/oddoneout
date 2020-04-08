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
            selected: -1
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

    fetchWords = async (generator, length) => {
        let res = await fetch('/generate?generator=' + generator + '&length=' + length + '&dist=75');
        let arr = await res.json();
        let shuffled = this.shuffle(arr);

        this.setState({ 
            words: shuffled, 
            root: shuffled.indexOf(arr[0]), 
            outlier: shuffled.indexOf(arr[length - 1]),
            answered: false 
        });
        console.log(this.state);
    }

    render() {
        const choices = this.state.words.map((word, idx) => {
            var wordClass = classNames('ba bw1 br-pill pv2 ph3 mh2 dim', {
                "b--light-gray light-gray": this.state.answered && idx != this.state.selected && idx != this.state.outlier,
                "b--mid-gray mid-gray": !this.state.answered,
                "b--green green": this.state.answered && idx == this.state.outlier,
                "b--light-red light-red": this.state.answered && this.state.selected != this.state.outlier && idx == this.state.selected
            })

            return (<p className={wordClass} onClick={this.choose.bind(this, idx)}>{word}</p>)
        })

        return (
            <div className="flex flex-column items-center w-50">
                <button className="bn f5 dim br3 pa2 white bg-light-red" onClick={() => this.fetchWords('centroid', 5)}>Generate!</button>
                <div className="flex flex-row ph3 justify-center">{choices}</div>
            </div>
        );
    }
}

ReactDOM.render(<App />, document.querySelector('#container'))
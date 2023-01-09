import axios from 'axios';
import mock from '../data/mock.js';
import { showNotification } from '../modules/showNotification.js';

/**
 * @class App
 */
export default class App {
  constructor(root) {
    this.root = root;
    this.mock = mock;
    this.timer = null;
    this.maxTime = 60;
    this.timeLeft = this.maxTime;
    this.charIndex = this.mistakes = this.isTyping = 0;

    this.root.innerHTML = `
    <h3 class='title'>Typing Speed Test</h3>
    <input class='visually-hidden' type='text' data-input=''>
    <p class='paragraph' data-typing=''></p>
    <ul>
    ${[
      { label: 'Time Left', value: '60s', data: 'time' },
      { label: 'Mistakes', value: 0, data: 'mistake' },
      { label: 'WPM', value: 0, data: 'wpm' },
      { label: 'CPM', value: 0, data: 'cpm' },
    ].map(({ label, value, data }) => `
      <li>
        <p class='h5'>${label}:</p>
        <span class='h4' data-${data}=''>${value}</span>
      </li>
    `).join('')}
    </ul>
    <button data-reset=''>Try Again</button>`;

    this.DOM = {
      typing: document.querySelector('[data-typing]'),
      inputTyping: document.querySelector('[data-input]'),
      btnReset: document.querySelector('[data-reset]'),
      optionTime: document.querySelector('[data-time]'),
      optionMistake: document.querySelector('[data-mistake]'),
      optionWpm: document.querySelector('[data-wpm]'),
      optionCpm: document.querySelector('[data-cpm]'),
    };

    this.init();
    this.DOM.btnReset.addEventListener('click', this.onReset);
    this.DOM.inputTyping.addEventListener('input', this.onInput);
  }

  /**
   * @function init - Initial app parameters
   */
  init = async () => {
    try {
      this.DOM.typing.innerHTML = '<h4>Loading...</h4>';
      const {
        data: {
          status,
          text,
        },
      } = await axios.get('https://fish-text.ru/get?format=json&type=sentence&number=4&self=true');
      this.DOM.typing.innerHTML = '';
      const paragraph = status !== 'success' ? this.mock[Math.floor(Math.random() * this.mock.length)] : text;
      paragraph.split('').forEach((char, idx) => this.DOM.typing.innerHTML += `<span class='h5 ${idx === 0 ? 'active' : ''}'>${char}</span>`);
      this.DOM.typing.addEventListener('click', () => this.DOM.inputTyping.focus());
      document.addEventListener('keydown', () => this.DOM.inputTyping.focus());
    } catch (e) {
      console.log(e);
      showNotification('danger', 'Something went wrong, open dev console.');
    }
  };

  /**
   * @function onReset - Reset app parameters
   */
  onReset = () => {
    this.init();
    clearInterval(this.timer);
    this.timeLeft = this.maxTime;
    this.charIndex = this.mistakes = this.isTyping = 0;
    this.DOM.inputTyping.value = '';
    this.DOM.optionTime.innerText = this.timeLeft;
    this.DOM.optionWpm.innerText = this.DOM.optionMistake.innerText = this.DOM.optionCpm.innerText = 0;
  };

  /**
   * @function onInput - Input change event handler
   * @param value
   */
  onInput = ({ target: { value } }) => {
    const characters = this.DOM.typing.querySelectorAll('span');
    const typedChar = value.split('')[this.charIndex];

    if (this.charIndex < characters.length - 1 && this.timeLeft > 0) {
      if (!this.isTyping) {
        this.timer = setInterval(this.initialTimer, 1000);
        this.isTyping = true;
      }

      if (typedChar === null) {

        if (this.charIndex > 0) {
          this.charIndex--;
          if (characters[this.charIndex].classList.contains('incorrect')) {
            this.mistakes--;
          }
          characters[this.charIndex].classList.remove('correct', 'incorrect');
        }

      } else {

        if (characters[this.charIndex].innerText === typedChar) {
          characters[this.charIndex].classList.add('correct');
        } else {
          this.mistakes++;
          characters[this.charIndex].classList.add('incorrect');
        }

        this.charIndex++;
      }

      characters.forEach(span => span.classList.remove('active'));
      characters[this.charIndex].classList.add('active');

      let wpm = Math.round(((this.charIndex - this.mistakes) / 5) / (this.maxTime - this.timeLeft) * 60);
      this.DOM.optionWpm.innerText = wpm < 0 || !wpm || wpm === Infinity ? 0 : wpm;
      this.DOM.optionMistake.innerText = this.mistakes;
      this.DOM.optionCpm.innerText = this.charIndex - this.mistakes;

    } else {
      clearInterval(this.timer);
      this.DOM.inputTyping.value = '';
    }
  };

  /**
   * @function initialTimer - Timer
   */
  initialTimer = () => {
    if (this.timeLeft > 0) {
      this.timeLeft--;
      this.DOM.optionTime.innerText = this.timeLeft;
      this.DOM.optionWpm.innerText = Math.round(((this.charIndex - this.mistakes) / 5) / (this.maxTime - this.timeLeft) * 60);
    } else {
      clearInterval(this.timer);
    }
  };
}

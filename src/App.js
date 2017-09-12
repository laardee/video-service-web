import React, { Component } from 'react';
import './App.css';

import { endpoint } from './config.json';

const mapClass = (Confidence) => {
  if (Confidence > 90) {
    return 'label high';
  } else if (Confidence > 70) {
    return 'label normal';
  }
  return 'label low';
};

const mapLabels = labels =>
  labels
    .sort((a, b) =>  b.Confidence - a.Confidence)
    .map(({ Confidence, Name }, index) =>
      ({ key: `item-${index}`, text: `${Name} [${Confidence}]`, labelClass: mapClass(Confidence) }))


const mapKeyFrames = frames =>
  frames
    .map((frame, index) =>
      Object.assign({}, frame, { key: `item-${index}`, text: `frame ${index}`, index }));


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: '',
      videoUrl: '',
      gifUrl: '',
      labels: [],
      allLabels: [],
      status: 'Select a video',
      session: '',
      frameLabels: [],
    };
    this._handleSubmit = this._handleSubmit.bind(this);
    this._handleSelectFrame = this._handleSelectFrame.bind(this);
  }

  _handleSubmit(event) {
    event.preventDefault();
    const { file } = this.state;
    return this._getSignedUrl(file.name)
      .then(data =>
        this._uploadFile(Object.assign({}, data, { file })))
      .then(session => this._getMetadata(session));
  }

  _getSignedUrl(filename) {
    const url = `${endpoint}/signed-url?file=${filename}`;
    this.setState({
      status: 'Getting URL for upload...',
    });
    return fetch(url, { mode: 'cors' })
      .then(response => response.json())
      .then((data) => {
        this.setState({
          status: data.message,
          session: data.session,
        });
        return data;
      });
  }

  _uploadFile({ url }) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      this.setState({
        status: 'Uploading video',
      });
      reader.onloadend = () =>
        fetch(url, {
          method: 'PUT',
          mode: 'cors',
          headers: {
            'content-length': this.state.file.size,
          },
          body: reader.result,
        })
          .then(() => resolve(this.state.session));

      reader.readAsArrayBuffer(this.state.file);
    });
  }

  _getMetadata(session) {
    const url = `${endpoint}/metadata/${session}`;
    return fetch(url)
      .then((response) => {
        if (response.ok === false) {
          return this.setState({
            status: 'Failed to process video',
            gifUrl: '',
            videoUrl: '',
            labels: [],
            allLabels: [],
            frameLabels: [],
          });
        }

        return response.json();
      })
      .then((data) => {
        if (data.status === 0) {
          this.setState({
            status: data.message,
          });
          setTimeout(() => {
            this._getMetadata(session);
          }, 5000);
        } else if (data.status === 1) {
          this.setState({
            status: data.message,
            gifUrl: data.gifUrl,
            videoUrl: data.videoUrl,
            allLabels: mapLabels(data.allLabels),
            labels: mapLabels(data.allLabels),
            frameLabels: mapKeyFrames(data.labels),
          });
        }

        return data;
      });
  }

  _handleImageChange(e) {
    e.preventDefault();
    const file = e.target.files[0];
    this.setState({
      file,
      status: `Press submit to upload "${file.name}"`,
    });
  }

  _handleSelectFrame({ event, time }) {
    event.preventDefault();
    let labels = [];
    let currentTime = 0;
    if (time === -1) {
      labels = this.state.allLabels;
    } else {
      currentTime = time;
      labels = mapLabels(this.state.frameLabels.filter(frameLabel => frameLabel.time === time)[0].labels);
    }
    document.getElementById('videoPlayer').currentTime = currentTime;
    this.setState({
      labels,
    });
  }

  render() {
    const {
      gifUrl,
      videoUrl,
      labels,
      status,
      frameLabels,
    } = this.state;

    return (
      <div className="container">
        <div className="title">
          <h1>Video Preview and Analysis Service</h1>
          <p>This example processes only first 30 seconds of the video.<br/>Videos and generated materials will be deleted eventually.</p>
        </div>
        <div className="header">
          <div className="form">
            <form onSubmit={e => this._handleSubmit(e)}>
              <input className="file-input" name="file" id="file" type="file" accept="video/mp4,video/x-m4v,video/*" onChange={e => this._handleImageChange(e)} />
              <label htmlFor="file">Choose a video</label>
              <button className="submit-button" type="submit" onClick={e => this._handleSubmit(e)}>Submit</button>
            </form>
          </div>
          <div className="status">
            <span>{status}</span>
          </div>
        </div>
        <div className="content">
          <div>
            <div id="video-container">
              <span>Original video</span>
              <video width="320" height="180" id="videoPlayer" controls src={videoUrl} />
            </div>
            <div id="preview-container">
              <span>GIF preview</span>
              <img alt="" src={gifUrl} />
            </div>
          </div>
          <div>
            <div className="frame-labels">
              <button onClick={event => this._handleSelectFrame({ event, time: -1 })} className="label">All labels</button>
              {frameLabels.map(({ key, time, text }) =>
                (<button onClick={event => this._handleSelectFrame({ event, time })} key={key} className="label">{text}</button>))}
            </div>
            <div className="labels">
              {labels.map(({ key, text, labelClass }) =>
                (<div key={key} className={labelClass}>{text}</div>))}
            </div>
          </div>
        </div>
        <div className="footer">
          <div>
            <a className="careers-link" href="https://sc5.io/careers">
              <span className="logo" />
              <span>sc5.io/careers</span></a>
          </div>
        </div>
      </div>
    );
  }
}

export default App;

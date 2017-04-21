import React, { Component } from 'react';
import './App.css';

import { endpoint } from './config.json';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: '',
      videoUrl: '',
      gifUrl: '',
      labels: [],
      status: 'Select a video',
      session: '',
    };
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
          });
        }

        return response.json();
      })
      .then((data) => {
        if (data.status === 0) {
          setTimeout(() => {
            this._getMetadata(session);
          }, 5000);
        } else if (data.status === 1) {
          const labels =
            data.labels
              .map(({ Confidence, Name }, index) =>
                ({ key: `item-${index}`, text: `${Name} [${Confidence}]` }));
          this.setState({
            status: data.message,
            gifUrl: data.gifUrl,
            videoUrl: data.videoUrl,
            labels,
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

  render() {
    const {
      gifUrl,
      videoUrl,
      labels,
      status,
    } = this.state;

    return (
      <div className="container">
        <div class="title">
          <h1>Video Preview and Analysis Service</h1>
        </div>
        <div className="header">
          <div className="form">
            <form onSubmit={e => this._handleSubmit(e)}>
              <input className="file-input" name="file" id="file" type="file" accept="video/*" onChange={e => this._handleImageChange(e)} />
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
              <video width="320" height="180" controls src={videoUrl} />
            </div>
            <div id="preview-container">
              <span>GIF preview</span>
              <img alt="" src={gifUrl} />
            </div>
          </div>
          <div className="labels">
            {labels.map(({ key, text }) =>
              (<div key={key} className="label">{text}</div>))}
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

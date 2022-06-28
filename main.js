const axios = require('axios');

const express = require('express');
const app = express();

const githubApi = new URL('https://api.github.com/repos/');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedSortBy = [ 'created', 'updated', 'comments' ];
const allowedSortDirection = [ 'desc', 'asc' ];
const allowedState = [ 'open', 'closed', 'all' ];

app
  .route('/api/')
    .get((_, res) => {
      return res
        .status(200)
        .send(
          [
            {
              endpoint: '/api/',
              description: 'Returns api description',
            },
            {
              endpoint: '/api/{name}/{repo}/',
              description: 'Returns issue list',
              params: {
                sort: allowedSortBy,
                direction: allowedSortDirection,
                state: allowedState,
                labels: 'A list of comma separated label names',
                since: 'ISO 8601 format YYYY-MM-DDTHH:MM:SSZ',
              }
            },
            {
              endpoint: '/api/{name}/{repo}/labels',
              description: 'Returns all allowed labels',
            }
          ]);
    });

app
  .route('/api/:name/:repo/labels')
    .get(async (req, res) => {
      let url = new URL(`${req.params.name}/${req.params.repo}/labels`, githubApi);

      try {
        let data = (await axios.get(url.toString())).data;
        return res
          .status(200)
          .send(data);
      } catch (err) {
        return res
        .status(400)
        .send(err.response.status == 403 ?
          { message: 'GitHub API rate limit exceeded' } : err.response.status == 404 ?
          { message: 'Repository not found' } : err.response.data); 
      }
    });

app
  .route('/api/:name/:repo')
    .get(async (req, res) => {
      let url = new URL(`${req.params.name}/${req.params.repo}/issues`, githubApi);

      let sortBy = req.query.sort;
      if (sortBy != undefined) {
        if (!allowedSortBy.includes(sortBy)) {
          return res
          .status(400)
          .send({ message: `Allowed sort: ${allowedSortBy}` });
        }

        url.searchParams.append('sort', sortBy);
      }

      let sortDirection = req.query.direction;
      if (sortDirection != undefined) {
        if (!allowedSortDirection.includes(sortDirection)) {
          return res
          .status(400)
          .send({ message: `Allowed sort direction: ${allowedSortDirection}` });
        }

        url.searchParams.append('direction', sortDirection);
      }

      let state = req.query.state;
      if (state != undefined) {
        if (!allowedState.includes(state)) {
          return res
          .status(400)
          .send({ message: `Allowed state: ${allowedState}` });
        }

        url.searchParams.append('state', state);
      }

      let since = req.query.since;
      if (since != undefined) {
        if (!Date.parse(since)) {
          return res
          .status(400)
          .send({ message: 'Allowed since timestamp in ISO 8601 format YYYY-MM-DDTHH:MM:SSZ' });
        }

        url.searchParams.append('since', since);
      }

      let labels = req.query.labels;
      if (labels != undefined) {
        if (labels.includes(' ')) {
          return res
          .status(400)
          .send({ message: 'Allowed labels is a list of comma separated label names' })
        }

        url.searchParams.append('labels', labels);
      }

      try {
        let data = (await axios.get(url.toString())).data;
        return res
          .status(200)
          .send(data);
      } catch (err) {
        return res
        .status(400)
        .send(err.response.status == 403 ?
          { message: 'GitHub API rate limit exceeded' } :err.response.status == 404 ?
          { message: 'Repository not found' } : err.response.data); 
      }
    });

app.listen(7000, 'localhost')

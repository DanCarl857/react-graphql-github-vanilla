import React, { useState, useEffect } from 'react'
import axios from 'axios'

const axiosGithubGraphQL = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {
    Authorization: `bearer ${process.env.REACT_APP_GITHUB_PERSONAL_ACCESS_TOKEN}`
  }
})

const GET_ISSUES_OF_REPOSITORY = `
  query($organization: String!, $repository: String!, $cursor: String) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        id
        name
        url
        viewerHasStarred
        issues(first: 10, after: $cursor, states: [OPEN]) {
          edges {
            node {
              id
              title
              url
              reactions(last: 3) {
                edges {
                  node {
                    id
                    content
                  }
                }
              }
            }
          }
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
`

const ADD_STAR = `
  mutation ($repositoryId: ID!) {
    addStart(input: { starrableId: $repositoryId }) {
      starrable {
        viewerHasStarred
      }
    }
  }
`

const getIssuesOfRepository = (path, cursor) => {
  const [organization, repository] = path.split('/')

  return axiosGithubGraphQL.post('', {
    query: GET_ISSUES_OF_REPOSITORY,
    variables: { organization, repository, cursor }
  })
}

const addStarToRepository = repositoryId => {
  return axiosGithubGraphQL.post('', {
    query: ADD_STAR,
    variables: { repositoryId }
  })
}

const TITLE = "React GraphQL Github Client"

const App = () => {

  const [path, setPath] = useState('the-road-to-learn-react/the-road-to-learn-react')
  const [organization, setOrganization] = useState(null)
  const [errors, setErrors] = useState(null)

  useEffect(() => {
    onFetchFromGithub(path)
  }, [path])

  const onStarRepository = (repositoryId, viewerHasStarred) => {
    addStarToRepository(repositoryId)
  }

  const onFetchMoreIssues = () => {
    const { endCursor } = organization.repository.issues.pageInfo
    onFetchFromGithub(path, endCursor)
  }

  const onChange = (event) => {
    setPath(event.target.value)
  }

  const onSubmit = (event) => {
    onFetchFromGithub(path)
    event.preventDefault()
  }

  const onFetchFromGithub = (path, cursor) => {
    getIssuesOfRepository(path, cursor).then(result => {
      setOrganization(result.data.data.organization)
      setErrors(result.data.errors)
    })
  }

  return (
    <div>
      <h1>{TITLE}</h1>

      <form onSubmit={onSubmit}>
        <label htmlFor="url">
          Show open issues for https://github.com/
        </label>
        <input
          id="url"
          type="text"
          value={path}
          onChange={onChange}
          style={{ width: '300px' }}
        />
        <button type="submit">Search</button>
      </form>

      <hr />
      {organization ? (
        <Organization
          organization={organization}
          errors={errors}
          onFetchMoreIssues={onFetchMoreIssues}
          onStarRepository={onStarRepository}
        />
      ) : (
        <p>No information yet...</p>
      )}
    </div>
  )
}

const Organization = ({ organization, errors, onFetchMoreIssues, onStarRepository }) => {
  if (errors) {
    return (
      <p>
        <strong>Something went wrong: </strong>
        {errors.map(error => error.message).join(' ')}
      </p>
    )
  }

  return (
    <div>
      <p>
        <strong>Issues from Organization: </strong>
        <a href={organization.url}>{organization.name}</a>
      </p>
      <Repository
        repository={organization.repository}
        onFetchMoreIssues={onFetchMoreIssues}
        onStarRepository={onStarRepository}
      />
    </div>
  )
}

const Repository = ({ repository, onFetchMoreIssues, onStarRepository }) => (
  <div>
    <p>
      <strong>In Repository: </strong>
      <a href={repository.url}>{repository.name}</a>
    </p>
    <button type="button" onClick={() => onStarRepository(repository.id, repository.viewerHasStarred)}>
      {repository.viewerHasStarred ? 'Unstar this Repository' : 'Star this Repository'}
    </button>

    <ul>
      {repository.issues.edges.map(issue => (
        <li key={issue.node.id}>
          <a href={issue.node.url}>{issue.node.title}</a>

          <ul>
            {issue.node.reactions.edges.map(reaction => (
              <li key={reaction.node.id}>{reaction.node.content}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
    <hr />
    <button onClick={onFetchMoreIssues}>Fetch More Issues</button>
  </div>
)

export default App
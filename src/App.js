import React, { useState, useEffect } from 'react'
import axios from 'axios'

const axiosGithubGraphQL = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {
    Authorization: `bearer ${process.env.REACT_APP_GITHUB_PERSONAL_ACCESS_TOKEN}`
  }
})

const GET_ISSUES_OF_REPOSITORY = `
  query($organization: String!, $repository: String!) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        name
        url
        issues(last: 5) {
          edges {
            node {
              id
              title
              url
            }
          }
        }
      }
    }
  }
`

const getIssuesOfRepository = (path) => {
  const [organization, repository] = path.split('/')

  return axiosGithubGraphQL.post('', {
    query: GET_ISSUES_OF_REPOSITORY,
    variables: { organization, repository}
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

  const onChange = (event) => {
    setPath(event.target.value)
  }

  const onSubmit = (event) => {
    onFetchFromGithub(path)
    event.preventDefault()
  }

  const onFetchFromGithub = (path) => {
    getIssuesOfRepository(path).then(result => {
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
        <Organization organization={organization} errors={errors} />
      ) : (
        <p>No information yet...</p>
      )}
    </div>
  )
}

const Organization = ({ organization, errors }) => {
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
      <Repository repository={organization.repository} />
    </div>
  )
}

const Repository = ({ repository }) => (
  <div>
    <p>
      <strong>In Repository: </strong>
      <a href={repository.url}>{repository.name}</a>
    </p>

    <ul>
      {repository.issues.edges.map(issue => (
        <li key={issue.node.id}>
          <a href={issue.node.url}>{issue.node.title}</a>
        </li>
      ))}
    </ul>
  </div>
)

export default App
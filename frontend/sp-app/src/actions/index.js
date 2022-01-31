import { SERVER } from '../config/global'

export const getArticles = (filterString, page, pageSize, sortField, sortOrder) => {
  return {
    type: 'GET_ARTICLES',
    payload: async () => {
      const response = await fetch(`${SERVER}/article?${filterString}&sortField=${sortField || ''}&sortOrder=${sortOrder || ''}&page=${page || ''}&pageSize=${pageSize || ''}`)
      const data = await response.json()
      return data
    }
  }
}

export const addArticle = (article, filterString, page, pageSize, sortField, sortOrder) => {
  return {
    type: 'ADD_ARTICLE',
    payload: async () => {
      let response = await fetch(`${SERVER}/article`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(article)
      })
      response = await fetch(`${SERVER}/article?${filterString}&sortField=${sortField || ''}&sortOrder=${sortOrder || ''}&page=${page || ''}&pageSize=${pageSize || ''}`)
      const data = await response.json()
      return data
    }
  }
}

export const saveArticle = (id, article, filterString, page, pageSize, sortField, sortOrder) => {
  return {
    type: 'SAVE_ARTICLE',
    payload: async () => {
      let response = await fetch(`${SERVER}/article/${id}`, {
        method: 'put',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(article)
      })
      response = await fetch(`${SERVER}/article?${filterString}&sortField=${sortField || ''}&sortOrder=${sortOrder || ''}&page=${page || ''}&pageSize=${pageSize || ''}`)
      const data = await response.json()
      return data
    }
  }
}

export const deleteArticle = (id, filterString, page, pageSize, sortField, sortOrder) => {
  return {
    type: 'DELETE_ARTICLE',
    payload: async () => {
      let response = await fetch(`${SERVER}/article/${id}`, {
        method: 'delete'
      })
      response = await fetch(`${SERVER}/article?${filterString}&sortField=${sortField || ''}&sortOrder=${sortOrder || ''}&page=${page || ''}&pageSize=${pageSize || ''}`)
      const data = await response.json()
      return data
    }
  }
}

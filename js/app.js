'use strict';

const apiUrl = 'http://127.0.0.1:9999/api/hw32/posts';

function ajax(method, url, headers, callbacks, body) {
    if (typeof callbacks.onStart === 'function') {
        callbacks.onStart();
    }

    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    xhr.onload = () => {
        if (xhr.status < 200 || xhr.status > 299) {
            if (typeof callbacks.onError === 'function') {
                callbacks.onError(xhr.statusText);
                return;
            }
        }
        if (typeof callbacks.onSuccess === 'function') {
            callbacks.onSuccess(xhr.responseText);
        }
    };
    xhr.onloadend = () => {
        if (typeof callbacks.onFinish === 'function') {
            callbacks.onFinish();
        }
    };
    xhr.onerror = () => {
        if (typeof callbacks.onError === 'function') {
            callbacks.onError('Network Error');
        }
    };

    const sHeaders = Object.entries(headers);
    if (sHeaders.length > 0) {
        xhr.setRequestHeader(sHeaders[0][0], sHeaders[0][1]);
    }

    if (body) {
        xhr.send(body);
    } else {
        xhr.send();
    }
}

function makePostEl(post) {
    const postEl = document.createElement('div');
    postEl.dataset.type = 'post';
    postEl.dataset.postId = post.id;

    const postAuthor = document.createElement('div');
    postAuthor.dataset.postPart = 'author';
    postAuthor.textContent = post.author;
    postEl.appendChild(postAuthor);

    const postText = document.createElement('div');
    postText.dataset.postPart = 'text';
    postText.textContent = post.text;
    postEl.appendChild(postText);

    const postRemove = document.createElement('div');
    postRemove.dataset.postAction = 'remove';
    postRemove.textContent = 'Удалить';
    postEl.appendChild(postRemove);

    return postEl;
}

function deletePosts(postsElement) {
    Array.from(postsElement.children).forEach((item) =>
        postsElement.removeChild(item)
    );
}

function renderPosts(postsElement, postsArr) {
    deletePosts(postsElement);
    postsArr.map(makePostEl).forEach((item) => {
        postsElement.appendChild(item);
    });
}




const rootEl = document.getElementById('root');

const loaderEl = document.createElement('div');
loaderEl.dataset.id = 'loader';
loaderEl.textContent = 'Идёт загрузка';
loaderEl.style.display = 'none';
rootEl.appendChild(loaderEl);

const formEl = document.createElement('form');
formEl.dataset.id = 'post-form';
rootEl.appendChild(formEl);

const fieldsetEl = document.createElement('fieldset');
fieldsetEl.dataset.id = 'post-fields';
formEl.appendChild(fieldsetEl);

const authorInputEl = document.createElement('input');
authorInputEl.dataset.input = 'author';
fieldsetEl.appendChild(authorInputEl);

const textInputEl = document.createElement('input');
textInputEl.dataset.input = 'text';
fieldsetEl.appendChild(textInputEl);

const addBtnEl = document.createElement('button');
addBtnEl.dataset.action = 'add';
addBtnEl.textContent = 'Добавить';
fieldsetEl.appendChild(addBtnEl);

const errorEl = document.createElement('div');
errorEl.dataset.id = 'message';
fieldsetEl.appendChild(errorEl);

const postsEl = document.createElement('div');
postsEl.dataset.id = 'posts';
rootEl.appendChild(postsEl);

let posts = [];

function loadData(){
    ajax(
        'GET',
        apiUrl,
        {},
        {
            onStart: () => {
                loaderEl.style.display = 'block';
                fieldsetEl.disabled = true;
            },
            onFinish: () => {
                loaderEl.style.display = 'none';
                fieldsetEl.disabled = false;
                authorInputEl.focus();
            },
            onSuccess: (data) => {
                posts = JSON.parse(data);
                console.log(posts);
                renderPosts(postsEl, posts);
            },
            onError: (error) => {
                console.log(error);
            },
        }
    );
}

function saveData(item){
    ajax(
        'POST',
        apiUrl,
        {'Content-Type': 'application/json'},
        {
            onStart: () => {
                loaderEl.style.display = 'block';
                fieldsetEl.disabled = true;
            },
            onFinish: () => {
                loaderEl.style.display = 'none';
                formEl.reset();
                fieldsetEl.disabled = false;
                authorInputEl.focus();
            },
            onSuccess: (data) => {
                const json = JSON.parse(data);
                console.log(json);
                item.id = json.id;
                posts.unshift(item);
                renderPosts(postsEl, posts);
            },
            onError: (error) => {
                console.log(error);
            },
        },
        JSON.stringify(item)
    );
}

function deleteData(index){
    ajax(
        'DELETE',
        `${apiUrl}/${index}`,
        {},
        {
            onStart: () => {
                loaderEl.style.display = 'block';
                fieldsetEl.disabled = true;
            },
            onFinish: () => {
                loaderEl.style.display = 'none';
                formEl.reset();
                fieldsetEl.disabled = false;
                authorInputEl.focus();
                renderPosts(postsEl, posts);
            },
            onError: (error) => {
                console.log(error);
            },
        }
    );
}

authorInputEl.focus();
loadData();

postsEl.addEventListener('click', (evt) => {
    if (evt.target.dataset.postAction !== 'remove') {
        return;
    }

    const id = Number(evt.target.parentElement.dataset.postId);
    deleteData(id);
    posts.splice(posts.findIndex(item => item.id === id),1);
});

formEl.onsubmit = (evt) => {
    evt.preventDefault();

    let error = null;
    errorEl.textContent = '';
    const author = authorInputEl.value.trim();
    if (author === '') {
        error = 'Заполните поле Автор';
        errorEl.textContent = error;
        authorInputEl.focus();
        return;
    }
    const text = textInputEl.value.trim();
    if (text === '') {
        error = 'Заполните поле Текст';
        errorEl.textContent = error;
        textInputEl.focus();
        return;
    }

    const post = {
        id: 0,
        text,
        author,
    };

    saveData(post);
};
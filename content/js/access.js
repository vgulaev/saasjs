function addEmail(email) {
  let emailTag = document.getElementById('email');
  httpPostAsync('access.srv', JSON.stringify({email: emailTag.value}))
    .then((data) => {
      location.reload();
    });
  console.log('Email: ' + emailTag.value);
}

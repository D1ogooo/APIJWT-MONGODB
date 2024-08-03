require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

app.use(express.json());

// Models
const User = require('./models/User')

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Private Route
app.get('/user/:id', checkToken ,async(req,res) => {
  const id = req.params.id
  const user = await User.findById(id, '-password')
  if(!user) {
    return res.status(404).json({ msg: 'Usuário não encontrado' })
  }
})

function checkToken(req,res,next) {
 const authHeader = req.headers['authorization']
 const token = authHeader && authHeader.split(" ")[1]
 if(!token) {
  return res.status(401).json({Message: "acesso negado"})
 }
 
 try {
  const secret = process.env.SECRET
  jwt.verify(token, secret)
  next()
 } catch (error) {
  res.status(400).json({ Message: "Token inválido" })
 }
}

// Register user
app.post('/auth/register', async(req,res) => {
 const { name , email , password, confirmPassword } = req.body
 if(!name || !email || !password) {
  return res.status(422).json({ Error: "Dados declarados inválidos" })
 }

 const userExists = await User.findOne({ email: email })
 if(userExists) {
  return res.status(422).json({ Error: "Favor utilizar outro email" })
 }

 const salt = await bcrypt.genSalt(12)
 const passwordHash = await bcrypt.hash(password, salt)

 const user = new User({
  name,
  email,
  password: passwordHash
 })

 try {
  await user.save()
  res.status(201).json({ message: "Usuário criado com sucesso!" })
 } catch (error) {
  res.status(500).json({ message: Error })
 }
})

app.post('/auth/user', async(req,res) => {
  const { email, password } = req.body
  if(!email || !password) {
   return res.status(422).json({ Error: "Dados declarados inválidos!" })
  }

  const user = await User.findOne({ email: email })
  if(!user) {
   return res.status(404).json({ Error: "Falha ao encontrar usuário!" })
  }

  const checkPassword = await bcrypt.compare(password, user.password)
  if(!checkPassword) {
   return res.status(422).json({ Error: "Senha inválida declarada!" })
  }

  try {
   const secret = process.env.SECRET
   const token = jwt.sign({
    id: user._id
   }, 
   secret,
  )
  res.status(200).json({ "message":"Authenticated", token })
  } catch (error) {
   res.status(500).json({ message: Error })
  }
})

const DBUSER = process.env.DB_USER;
const DBPASSWORD = process.env.DB_PASSWORD;

mongoose.connect(
  `mongodb+srv://${DBUSER}:${DBPASSWORD}@cluster0.ppohqdb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`,
)
.then(() => {
  console.log('Banco de dados conectado.');

  app.listen(port, () => {
    console.log(`Servidor está funcionando na porta ${port}`);
  });
})
.catch((error) => {
  console.error('Erro ao conectar ao banco de dados:', error);
});
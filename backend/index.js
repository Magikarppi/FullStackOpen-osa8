const { ApolloServer, UserInputError, AuthenticationError, gql } = require('apollo-server');
const mongoose = require('mongoose');
// const uuidv1 = require('uuid/v1');
require('dotenv').config();
const jwt = require('jsonwebtoken')

const JWT_SECRET = 'secret'

const Book = require('./models/Book');
const Author = require('./models/Author');
const User = require('./models/User')

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

console.log('MONGODB_URI', process.env.MONGODB_URI);

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('connected to MongoDB');
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message);
  });

const typeDefs = gql`
  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type Author {
    name: String
    id: ID!
    born: Int
    bookCount: Int
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book]
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      id: ID
      born: Int
      bookCount: Int
      setBornTo: Int
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }
`;

const resolvers = {
  Query: {
    me: async (root, args, context) => {
      return context.currentUser
    },
    bookCount: async (root) => {
      console.log('root in bookCount', root);
      console.log('book.collectoin', await Book.collection.countDocuments());
      const books = await Book.find({ author: root.name });
      console.log('books in bookCount query', books);
      return books.length;
      // Book.collection.countDocuments()
    },
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      console.log('args in allbooks', args);
      if (!Object.keys(args).length) {
        const books = await Book.find({}).populate("author", {
          name: 1,
          born: 1
        });
        return books;
      }

      if (args.author && args.genre) {
        const authorsBooks = await Book.find({ author: args.author }).populate("author", {
          name: 1,
          born: 1
        });
        // const authorsBooks = books.filter(
        //   (book) => book.author === args.author
        // );
        const authorsBooksByGenre = authorsBooks.filter((book) =>
          book.genres.find((genre) => genre === args.genre)
        );
        return authorsBooksByGenre;
      }

      if (args.author) {
        console.log('args', args);
        // console.log(books.filter((book) => book.author === args.author));
        // return books.filter((book) => book.author === args.author);
        return Book.find({ author: args.author }).populate("author", {
          name: 1,
          born: 1
        });
      }

      if (args.genre) {
        // return books.filter((book) =>
        //   book.genres.find((genre) => genre === args.genre)
        // );
        // const books = await Book.find({}).populate("author", {
        //   name: 1,
        //   born: 1
        // });
        console.log('if args.genre')
        
        const books = await Book.find({}).populate("author genre");
        console.log('books g', books);
        const filteredBooks = books.filter((book) =>
        book.genres.find((genre) => genre === args.genre)
      );
      console.log('filteredBooks in allBooks', filteredBooks)
        return filteredBooks
      }
    },
    allAuthors: async () => {
      const authors = await Author.find({})
      return authors
    }
  },
  // Author: {
  //   bookCount: async (root) => {
  //     console.log('root in Author:', root);
  //     const books = await Book.find({ author: root.name });
  //     console.log('books in Author', books);
  //     // const filteredBooks = books.filter((book) => book.author === root.name)
  //     // console.log('filteredBooks', filteredBooks)
  //     return books.length;
  //   }
  // },
  Mutation: {
    addBook: async (root, args, context) => {
      console.log('args in addbook', args)
      const author = await Author.findOne({ name: args.author });
      console.log('author in addbook', author)
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }

      console.log('addBook continues with currentuser', currentUser)
      if (!author) {
        console.log('author not found');
        const newAuthor = new Author({
          name: args.author,
          born: null
        });
        console.log('newAuthor', newAuthor);

        try {
          await newAuthor.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args
          });
        }
        // const book = new Book({ ...args, id: uuidv1(), author: newAuthor });
        const book = new Book({ ...args, author: newAuthor });
        console.log('book in addBook', book)
        try {
          await book.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args
          });
        }
        return book;
      }

      const book = new Book({ ...args, author: author });
      // const book = new Book({ ...args, id: uuidv1(), author: author });
      console.log('book in addBook', book)
      try {
        await book.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args
        });
      }
      return book;

      // const authors = await Author.find({});
      // console.log('authors in addbook', authors);
      // console.log('args in addbook', args);
      // if (!authors.find((author) => author.name === args.author)) {
      //   console.log('Author not found')
      //   const newAuthor = new Author({
      //     name: args.author,
      //     id: uuidv1(),
      //     born: null
      //   });
      //   // authors = [...authors, newAuthor];
      //   await newAuthor.save();
      //   const book = new Book({
      //     title: args.title,
      //     author: newAuthor,
      //     published: args.published,
      //     genres: args.genres,
      //     id: uuidv1()
      //   });
      //   // books = books.concat(book);
      //   await book.save();
      //   return book;
      // } else {
      //   const book = new Book({ ...args, id: uuidv1() });
      //   // books = books.concat(book);
      //   await book.save();
      //   return book;
      // }
    },
    editAuthor: async (root, args, context) => {
      console.log('args', args);
      // const authorForEdit = authors.find(
      //   (author) => author.name === args.name
      // );
      const authorForEdit = await Author.findOne({ name: args.name });

      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }

      if (authorForEdit) {
        authorForEdit.born = args.setBornTo;
        // const authorEdited = new Author ({
        //   ...authorForEdit,
        //   born: args.setBornTo
        // });
        // authors = authors.map(author => author.name !== args.name ? author : authorEdited)
        try {
          await authorForEdit.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args
          });
        }
        return authorForEdit;
      }
      return null;
    },
    createUser: async (root, args) => {
      console.log('args in createuser', args)
      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })

      console.log('user in createUser', user)
      return user.save()
      .catch(error => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      })
    },
    login: async (root, args) => {
      console.log('login runs with args', args)
      const user = await User.findOne({ username: args.username })
  
      if ( !user || args.password !== JWT_SECRET ) {
        throw new UserInputError("wrong credentials")
      }
  
      const userForToken = {
        username: user.username,
        id: user._id,
      }
  
      return { value: jwt.sign(userForToken, JWT_SECRET) }
    },
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  }
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});

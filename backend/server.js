import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Sequelize } from 'sequelize';
import dotenv from "dotenv";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const Op = Sequelize.Op

let app = express();
let router = express.Router();

let sequelize;
if (process.env.NODE_ENV === 'development') {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: 'sample.db'
    })
}
else {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    })
}

const Article = sequelize.define("Article", {
    articleId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull : false
    },

    articleTitle: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            isEven(value) {
                if (value.length < 5) {
                    throw new Error('For the title there should be at least five characters')
                }
            }
        }
    },

    articleAbstract: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            isEven(value) {
                if (value.length < 10) {
                    throw new Error('For the abstract there should be at least ten characters')
                }
            }
        }
    },

    articleDate: {
        type: Sequelize.DATE,
        allowNull: false
    }
});

const Reference = sequelize.define("Reference", {
    referenceId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull : false
    },

    referenceTitle: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            isEven(value) {
                if (value.length < 5) {
                    throw new Error('For the title there should be at least five characters')
                }
            }
        }
    },

    referenceDate: {
        type: Sequelize.DATE,
        allowNull: false
    },

    referenceAuthors: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

Article.hasMany(Reference);

app.use(express.static(path.join(__dirname, './build')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());
app.use('/', router);
app.use(express.static("build"));

async function createArticle(article){
    console.log(article);
    return await Article.create(article);
}

async function getArticle(req){
    //return await Article.findAll();
    try {
        const query = {}
        let pageSize = 2
        const allowedFilters = ['articleTitle', 'articleAbstract']
        const filterKeys = Object.keys(req.query).filter(e => allowedFilters.indexOf(e) !== -1)

        if (filterKeys.length > 0) {
          query.where = {}
          for (const key of filterKeys) {
            query.where[key] = {
              [Op.like]: `%${req.query[key]}%`
            }
          }
        }
        console.log(query);
        const sortField = req.query.sortField
        let sortOrder = 'ASC'
        if (req.query.sortOrder && req.query.sortOrder === '-1') {
          sortOrder = 'DESC'
        }
    
        if (req.query.pageSize) {
          pageSize = parseInt(req.query.pageSize)
        }
    
        if (sortField) {
          query.order = [[sortField, sortOrder]]
        }
    
        if (!isNaN(parseInt(req.query.page))) {
          query.limit = pageSize
          query.offset = pageSize * parseInt(req.query.page)
        }
    
        const records = await Article.findAll(query)
        const count = await Article.count()
        return {records, count};
      } catch (e) {
        console.warn(e)
        return;
      }
}

async function getArticleById(id){
    return await Article.findByPk(id, {
        include: Reference
    });
}

async function updateArticle(id, article){
    let updateEntity = await getArticleById(id);

    if (!updateEntity){
        console.log("There is no article having this id");
        return;
    }

    return updateEntity.update(article);
}

async function deleteArticle(id){
    let deleteEntity = await getArticleById(id);

    if (!deleteEntity){
        console.log("There is no article having this id");
        return;
    }

    return await deleteEntity.destroy();
}

async function createReference(aid, reference){
    try {
        const article = await Article.findByPk(aid);
        if (article) {
            const referenceObj = reference;
            referenceObj.ArticleArticleId = article.articleId;
            return await Reference.create(referenceObj);
        }
        else {
            console.log("There is no article having this id");
            return;
        }
    }
    catch (err) {
        console.log(err);
    }
    return await Reference.create(reference);
}

async function getReferences(aid){
    try {
        const article = await Article.findByPk(aid);
        if (article) {
            return await article.getReferences();
        }
        else {
            console.log("There is no article having this id");
            return;
        }
    }
    catch (err) {
        console.log(err);
    }
}

async function getReferenceById(aid, rid){
    try {
        const article = await Article.findByPk(aid);
        if (article) {
            const references = await article.getReferences({
                where: {
                    referenceId: rid
                }
            });
            const reference = references.shift();
            if (references) {
                return reference;
            }
        }
        else {
            console.log("There is no article having this id");
            return;
        }
    }
    catch (err) {
        console.log(err);
    }
}

async function updateReference(aid, rid, reference){
    const article = await Article.findByPk(aid);
    if (article) {
        let referenceObj = await article.getReferences({
            where: {
                referenceId: rid
            }
        });
        let result = referenceObj.shift();
        if (result) {
            return await result.update(reference);
        }
        else {
            console.log("There is no reference having this id");
            return;
        }
    }
    else {
        console.log("There is no article having this id");
    }
}

async function deleteReference(aid, rid){
    const article = await Article.findByPk(aid);
    console.log(article);
    if (article) {
        let referenceObj = await article.getReferences({
            where: {
                referenceId: rid
            }
        });
        let result = referenceObj.shift();
        if (result) {
            return await result.destroy();
        }
        else {
            console.log("There is no reference having this id");
            return;
        }
    }
    else {
        console.log("There is no article having this id");
    }
}

router.route('/article').post(async (req, res) => {
    res.status(201).json(await createArticle(req.body));
})

router.route('/article').get(async (req, res) => {
    res.status(201).json(await getArticle(req));
})


router.route('/article/:id').get(async (req, res) => {
    res.json(await getArticleById(req.params.id));
})

router.route('/article/:id').put(async (req, res) => {
    res.json(await updateArticle(req.params.id, req.body));
})

router.route('/article/:id').delete(async (req, res) => {
    res.json(await deleteArticle(req.params.id));
})

router.route('/article/:aid/references').get(async (req, res) => {
    res.json(await getReferences(req.params.aid));
})

router.route('/article/:aid/references').post(async (req, res) => {
    res.status(201).json(await createReference(req.params.aid, req.body));
})

router.route('/article/:aid/references/:rid').get(async (req, res) => {
    res.json(await getReferenceById(req.params.aid, req.params.rid));
})

router.route('/article/:aid/references/:rid').put(async (req, res) => {
    res.json(await updateReference(req.params.aid, req.params.rid, req.body));
})

router.route('/article/:aid/references/:rid').delete(async (req, res) => {
    res.json(await deleteReference(req.params.aid, req.params.rid));
})

router.route('/').get(async (req, res) => {
    let projectPath = path.resolve();
    let htmlPath = path.join(projectPath, "build", "index.html");
    res.sendFile(htmlPath);
})

let port = process.env.PORT || 8086;
app.listen(port, async () => {
    await sequelize.sync({ alter: true })
});
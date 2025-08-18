// Backend Express para autenticação LDAP
const express = require('express');
const bodyParser = require('body-parser');
const ldap = require('ldapjs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configurações LDAP
const LDAP_URL = 'ldap://ginseng.local:389';
const LDAP_BIND_DN = 'portal.cameras@ginseng.local';
const LDAP_BIND_PASSWORD = '143Pir8hI£w9~5f';
const LDAP_BASE_DN = 'dc=ginseng,dc=local'; // Ajuste conforme sua estrutura

// Endpoint de autenticação
app.post('/api/auth/ldap', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Usuário e senha obrigatórios.' });
  }

  const client = ldap.createClient({ url: LDAP_URL });

  // Primeiro faz bind com usuário de serviço
  client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, err => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao conectar no LDAP.' });
    }
    // Busca DN do usuário
    const searchOptions = {
      filter: `(sAMAccountName=${username})`,
      scope: 'sub',
      attributes: ['dn']
    };
    client.search(LDAP_BASE_DN, searchOptions, (err, searchRes) => {
      if (err) {
        client.unbind();
        return res.status(500).json({ success: false, message: 'Erro na busca LDAP.' });
      }
      let userDN = null;
      searchRes.on('searchEntry', entry => {
        userDN = entry.object.dn;
      });
      searchRes.on('end', () => {
        if (!userDN) {
          client.unbind();
          return res.status(401).json({ success: false, message: 'Usuário não encontrado.' });
        }
        // Tenta autenticar com o DN do usuário e senha informada
        const userClient = ldap.createClient({ url: LDAP_URL });
        userClient.bind(userDN, password, err => {
          userClient.unbind();
          client.unbind();
          if (err) {
            return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
          }
          return res.json({ success: true });
        });
      });
      searchRes.on('error', () => {
        client.unbind();
        return res.status(500).json({ success: false, message: 'Erro na busca LDAP.' });
      });
    });
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Servidor de autenticação LDAP rodando na porta ${PORT}`);
});

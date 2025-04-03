# Publidashboard

O PubliDashboard oferece uma gestão eficiente e acessível para suas campanhas de marketing. Monitore resultados, acompanhe métricas em tempo real e otimize seus investimentos em publicidade de qualquer lugar, a qualquer momento.

### Equipe:
- Lucas Luis de Souza
- Mateus da Silva
- Jadson Abreu
- Mateus nepomuceno
- Renan Alcantara

  
## Guia para Rodar um Projeto Angular

Este guia explica, de forma simples, como instalar e rodar um projeto Angular do zero.

### O que você precisa antes de começar?

Antes de tudo, você precisa instalar:

- [Node.js](https://nodejs.org/) (versão LTS recomendada) - Ele é necessário para rodar o Angular.
- [Angular CLI](https://angular.io/cli) - Uma ferramenta que facilita a criação e execução de projetos Angular.
- [Git](https://git-scm.com/) - Necessário para baixar o projeto do GitHub.

### Passo 1: Instalar o Node.js

Se você ainda não tem o Node.js instalado, siga estes passos:

1. Acesse [https://nodejs.org/](https://nodejs.org/).
2. Baixe a versão recomendada (LTS).
3. Instale o Node.js seguindo as instruções na tela.

Após a instalação, verifique se deu certo abrindo o terminal (Prompt de Comando, PowerShell ou Terminal do Mac/Linux) e digitando:

```sh
node -v
npm -v
```

Se aparecerem números indicando as versões instaladas, você está pronto para o próximo passo!

### Passo 2: Instalar o Angular CLI

Agora, instale a ferramenta Angular CLI, que ajuda a criar e rodar projetos Angular. No terminal, digite:

```sh
npm install -g @angular/cli
```

Para verificar se foi instalado corretamente, execute:

```sh
ng version
```

Se aparecer informações do Angular, tudo certo!

### Passo 3: Instalar o Git

Se ainda não tem o Git instalado, siga estes passos:

1. Acesse [https://git-scm.com/](https://git-scm.com/).
2. Baixe a versão para o seu sistema operacional.
3. Instale o Git seguindo as instruções na tela.

Após a instalação, verifique se está funcionando corretamente digitando no terminal:

```sh
git --version
```

Se aparecer um número de versão, significa que o Git foi instalado com sucesso!

### Passo 4: Baixar o projeto

Se o projeto estiver disponível no GitHub, faça o seguinte:

1. No terminal, vá até a pasta onde deseja salvar o projeto.
2. Digite o seguinte comando:

```sh
git clone https://github.com/LucasLuis-Dev/PubliDashboard.git
```

3. Entre na pasta do projeto digitando:

```sh
cd nome-do-projeto
```

### Passo 5: Instalar os arquivos necessários

Agora que você está dentro da pasta do projeto, instale tudo o que ele precisa para funcionar:

```sh
npm install
```

Isso pode demorar um pouco. Quando terminar, o projeto estará pronto para rodar.

### Passo 6: Rodar o projeto

Agora, vamos abrir o projeto no navegador. No terminal, digite:

```sh
ng serve
```

Se tudo der certo, você verá uma mensagem dizendo que o projeto está rodando. Agora, abra o navegador e acesse:

[http://localhost:4200](http://localhost:4200)

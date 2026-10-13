            <script type="module">
                import { initializeApp } from
                    "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

                import { 
                    getAuth, 
                    createUserWithEmailAndPassword, 
                    signInWithEmailAndPassword, 
                    onAuthStateChanged, 
                    signOut, 
                    deleteUser 
                } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

                import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from
                    "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

                const firebaseConfig = {
                    apiKey: "AIzaSyDrLCoUhezEKy6qtSCTSa25AxyStKtmw8M",
                    authDomain: "lar-de-maria-f2c45.firebaseapp.com",
                    projectId: "lar-de-maria-f2c45",
                    storageBucket: "lar-de-maria-f2c45.firebasestorage.app",
                    messagingSenderId: "839400810340",
                    appId: "1:839400810340:web:f601ba799d518e5292fc71"
                };

                const app = initializeApp(firebaseConfig);
                const auth = getAuth(app);
                const banco = getFirestore(app);

                function exibirAlertaCustom(mensagem) {
                    let dialog = document.getElementById("modal-alerta-custom");
                    
                    if (!dialog) {
                        dialog = document.createElement("dialog");
                        dialog.id = "modal-alerta-custom";
                        document.body.appendChild(dialog);
                    }

                    dialog.innerHTML = `
                        <p style="margin-bottom: 20px; font-size: 16px; font-weight: 700; color: #2D2D2D; line-height: 1.4;">${mensagem}</p>
                        <button id="btn-ok-alerta">OK</button>
                    `;

                    dialog.querySelector("#btn-ok-alerta").onclick = () => {
                        dialog.close();
                    };

                    dialog.showModal();
                }

                onAuthStateChanged(auth, async (usuario) => {
                    const btnNav = document.querySelector(".btn-coral-nav");
                    const cardBloqueado = document.querySelector(".card-bloqueado");
                    const btnCadastrarHome = document.getElementById("btn-cadastrar-home");

                    if (usuario) {
                        let nomeUsuario = usuario.email.split('@')[0];

                        try {
                            const docRef = doc(banco, "usuarios", usuario.uid);
                            const docSnap = await getDoc(docRef);
                            if (docSnap.exists() && docSnap.data().nome) {
                                nomeUsuario = docSnap.data().nome;
                            }
                        } catch (erro) {
                            console.error("Erro ao buscar dados do perfil:", erro);
                        }

                        if (btnNav) {
                            btnNav.textContent = `Sair (${nomeUsuario})`;
                            btnNav.onclick = (e) => {
                                e.preventDefault();
                                window.fazerlogout();
                            };
                            btnNav.removeAttribute("for");
                        }
                        if (cardBloqueado) {
                            cardBloqueado.innerHTML = `
                                <h3>Você está logado como ${nomeUsuario}!</h3>
                                <p>Agora você pode agendar uma visita.</p>
                            `;
                        }

                        if (btnCadastrarHome) {
                            btnCadastrarHome.style.display = "none";
                        }
                    } else {
                        if (btnNav) {
                            btnNav.textContent = "Entrar / Cadastrar";
                            btnNav.setAttribute("for", "check-modal");
                            btnNav.onclick = null;
                        }

                        if (btnCadastrarHome) {
                            btnCadastrarHome.style.display = "block";
                        }
                    }
                });

                window.fazerlogin = async function() {
                    const email = document.getElementById("loginemail").value.trim();
                    const senha = document.getElementById("loginsenha").value;
                    const botao = document.querySelector(".form-login button");

                    if (!email || !senha) {
                        exibirAlertaCustom("Preencha o e-mail e a senha.");
                        return;
                    }

                    botao.disabled = true;
                    botao.textContent = "Entrando...";

                    try {
                        const credencial = await signInWithEmailAndPassword(auth, email, senha);
                        const usuario = credencial.user;

                        let nomeParaExibir = usuario.email.split('@')[0];
                        try {
                            const docRef = doc(banco, "usuarios", usuario.uid);
                            const docSnap = await getDoc(docRef);
                            if (docSnap.exists() && docSnap.data().nome) {
                                nomeParaExibir = docSnap.data().nome;
                            }
                        } catch (e) {
                            console.error("Não foi possível carregar o nome no login:", e);
                        }

                        exibirAlertaCustom(`Você entrou na conta de "${nomeParaExibir}".`);

                        document.getElementById("loginemail").value = "";
                        document.getElementById("loginsenha").value = "";
                        document.getElementById("check-modal").checked = false;
                    } catch (erro) {
                        console.error("Erro no login:", erro.code);
                        const mensagens = {
                            "auth/invalid-credential": "E-mail ou senha incorretos.",
                            "auth/user-not-found": "Usuário não encontrado.",
                            "auth/wrong-password": "Senha incorreta.",
                            "auth/invalid-email": "E-mail inválido."
                        };
                        exibirAlertaCustom(mensagens[erro.code] || "Não foi possível fazer login.");
                    } finally {
                        botao.disabled = false;
                        botao.textContent = "Entrar";
                    }
                };

                window.fazerlogout = function() {
                    let dialog = document.getElementById("modal-confirmacao-logout");
                    
                    if (!dialog) {
                        dialog = document.createElement("dialog");
                        dialog.id = "modal-confirmacao-logout";
                        
                        dialog.innerHTML = `
                            <p>Tem certeza que deseja encerrar a sessão?</p>
                            <button id="btn-continuar-logout">Continuar</button>
                            <button id="btn-cancelar-logout">Cancelar</button>
                        `;
                        document.body.appendChild(dialog);
                    }

                    dialog.querySelector("#btn-continuar-logout").onclick = async () => {
                        dialog.close();
                        try {
                            await signOut(auth);
                            exibirAlertaCustom("Sessão encerrada com sucesso.");
                        } catch (erro) {
                            exibirAlertaCustom("Erro ao sair da conta.");
                        }
                    };

                    dialog.querySelector("#btn-cancelar-logout").onclick = () => {
                        dialog.close();
                    };

                    dialog.showModal();
                };

                window.confirmarcadastro = async function () {
                    const campoNome = document.getElementById("cadastronome");
                    const campoEmail = document.getElementById("cadastroemail");
                    const campoSenha = document.getElementById("cadastrosenha");
                    const botao = document.querySelector(".form-cadastro button");

                    const nome = campoNome.value.trim();
                    const email = campoEmail.value.trim();
                    const senha = campoSenha.value;

                    if (!nome || !email || !senha) {
                        exibirAlertaCustom("Preencha todos os campos.");
                        return;
                    }

                    if (!campoEmail.checkValidity()) {
                        exibirAlertaCustom("Digite um e-mail válido.");
                        return;
                    }

                    if (senha.length < 6) {
                        exibirAlertaCustom("A senha precisa ter pelo menos 6 caracteres.");
                        return;
                    }

                    botao.disabled = true;
                    botao.textContent = "Cadastrando...";
                    let usuarioCriado = null;

                    try {
                        const resultado = await createUserWithEmailAndPassword(
                            auth, email, senha
                        );
                        usuarioCriado = resultado.user;

                        await setDoc(doc(banco, "usuarios", usuarioCriado.uid), {
                            nome,
                            email: usuarioCriado.email,
                            criadoEm: serverTimestamp()
                        });

                        campoNome.value = "";
                        campoEmail.value = "";
                        campoSenha.value = "";
                        document.getElementById("check-modal").checked = false;

                        exibirAlertaCustom(`Cadastro realizado com sucesso! Você já está logado como "${nome}".`);
                    } catch (erro) {
                        console.error("Erro no cadastro:", erro.code);

                        if (usuarioCriado) {
                            try {
                                await deleteUser(usuarioCriado);
                            } catch {
                                exibirAlertaCustom(
                                    "A conta foi criada, mas o perfil não foi salvo. " +
                                    "Confira o Firestore antes de tentar cadastrar novamente."
                                );
                                return;
                            }
                        }

                        const mensagens = {
                            "auth/email-already-in-use": "Esse e-mail já está cadastrado.",
                            "auth/invalid-email": "E-mail inválido.",
                            "auth/weak-password": "Escolha uma senha mais forte.",
                            "auth/password-does-not-meet-requirements":
                            "A senha não atende aos requisitos configurados no Firebase.",
                            "auth/operation-not-allowed":
                            "Ative E-mail/senha no Firebase Authentication.",
                            "auth/network-request-failed": "Confira sua conexão.",
                            "permission-denied": "Confira as regras do Firestore."
                        };

                        exibirAlertaCustom(mensagens[erro.code] || "Não foi possível concluir o cadastro.");
                    } finally {
                        botao.disabled = false;
                        botao.textContent = "Cadastrar";
                    }
                };
            </script>
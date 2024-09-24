const bcrypt = require('bcryptjs')
const { send } = require('process');
const User = require('../models/User');
const {sendPasswordResetEmail} = require('../services/emailService');
const crypto = require('crypto');
const { use } = require('../routes/userRoutes');

const requestPasswordReset = async (req, res) => {
    const {email} = req.body;

    try{
        const user = await User.findOne({email});
        if(!user) {
            return res.status(404).json({ message: 'Usuário não encontrado'});
        }

        //Gera um token e define um tempo de expiração
        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;  //Define a expiração do token para até 1 hora

        await user.save();

        await sendPasswordResetEmail(email, token);
        res.status(200).json({message: 'E-mail de recuperação enviado'});
    } catch (error) {
        res.status(500).json({message: 'Erro ao enviar e-mail'});
    }
};

//Função para redefinir a senha
const resetPassword = async (req, res) => {
    const {token} = req.params;
    const {password} = req.body;

    //Verifica se a senha foi inserida
    if(!password){
        return res.status(400).json({message: 'Nova senha é obrigatório'});
    }

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: {$gt: Date.now()},
        });

        if (!user){
            return res.status(400).json({message: 'Token inválido ou expirado'});
        }

        //Hasheando a nova senha antes de salvar
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await use.save();
        res.status(200).json({message: 'Senha redefinida com sucesso'});
    } catch (error) {
        res.status(500).json({message: 'Erro ao redefinir a senha'});
    }
};


module.exports = {requestPasswordReset};
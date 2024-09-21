<?php
session_start();
include 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'];
    $password = $_POST['password'];

    //下sql
    $stmt = $pdo->prepare("SELECT * FROM member WHERE user_name = :username AND passwd = :password");
    $stmt->execute(['username' => $username, 'password' => $password]);
    
    if ($stmt->rowCount() > 0) {
        $_SESSION['username'] = $username;
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }
}
?>
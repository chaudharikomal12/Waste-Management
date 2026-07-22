import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit, OnDestroy {
  currentUser: any;
  contacts: any[] = [];
  selectedContact: any = null;
  messages: any[] = [];
  newMessage = '';
  socket!: Socket;

  showNewMessagePanel = false;
  contactableUsers: any[] = [];
  contactSearch = '';

  constructor(private api: ApiService, private auth: AuthService, private snack: MatSnackBar) {}

  ngOnInit() {
    this.currentUser = this.auth.getUser();
    this.loadContacts();
    this.initSocket();
  }

  initSocket() {
    this.socket = io(environment.socketUrl || 'http://localhost:5000');
    this.socket.emit('joinRoom', this.currentUser.id);
    this.socket.on('receiveMessage', (msg: any) => {
      if (this.selectedContact && msg.senderId === this.selectedContact._id) {
        this.messages.push(msg);
      }
      // Refresh the contact list in case this is a brand-new conversation
      this.loadContacts();
    });
  }

  loadContacts() {
    this.api.getContacts().subscribe((data: any) => {
      const seen = new Set();
      const contacts: any[] = [];
      data.forEach((m: any) => {
        const other = m.senderId._id === this.currentUser.id ? m.receiverId : m.senderId;
        if (!seen.has(other._id)) { seen.add(other._id); contacts.push(other); }
      });
      this.contacts = contacts;
    });
  }

  openNewMessagePanel() {
    this.showNewMessagePanel = true;
    this.contactSearch = '';
    this.api.getContactableUsers().subscribe((data: any) => this.contactableUsers = data);
  }

  get filteredContactableUsers() {
    const q = this.contactSearch.trim().toLowerCase();
    if (!q) return this.contactableUsers;
    return this.contactableUsers.filter((u: any) =>
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }

  startConversationWith(user: any) {
    this.showNewMessagePanel = false;
    this.selectContact(user);
    // Add to the visible contact list immediately so it doesn't look like it vanished
    if (!this.contacts.some((c: any) => c._id === user._id)) {
      this.contacts = [user, ...this.contacts];
    }
  }

  selectContact(contact: any) {
    this.selectedContact = contact;
    this.api.getConversation(contact._id).subscribe((data: any) => this.messages = data);
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedContact) return;
    const content = this.newMessage.trim();
    this.api.sendMessage(this.selectedContact._id, content).subscribe({
      next: (msg: any) => {
        this.messages.push(msg);
        this.socket.emit('sendMessage', { ...msg, receiverId: this.selectedContact._id });
        this.newMessage = '';
        this.loadContacts();
      },
      error: () => this.snack.open('Failed to send message', 'Close', { duration: 3000 })
    });
  }

  isOwn(msg: any): boolean {
    return msg.senderId === this.currentUser.id || msg.senderId?._id === this.currentUser.id;
  }

  ngOnDestroy() { this.socket?.disconnect(); }
}

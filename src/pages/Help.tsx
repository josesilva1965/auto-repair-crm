import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/card';

export function Help() {
    const { i18n } = useTranslation();
    const lang = i18n.language;

    const content = {
        'en-GB': {
            title: 'Help & Instructions',
            subtitle: 'User Guide',
            overview: {
                title: '1. Overview',
                text: 'Welcome to the Auto Repair CRM! This application is designed to help auto repair shops manage their daily operations, including work orders, customer data, vehicle history, inventory, and more.'
            },
            gettingStarted: {
                title: '2. Getting Started',
                dashboard: 'Dashboard: Upon logging in, you will see the Dashboard, which gives you a quick overview of today\'s revenue, active jobs, and low stock alerts.',
                navigation: 'Navigation: Use the sidebar on the left to navigate between different sections like Work Orders, Customers, and Settings.'
            },
            features: {
                title: '3. Feature Guides',
                dashboard: { title: 'Dashboard', items: ['View key performance indicators (KPIs).', 'See a list of active technicians and their status.', 'Monitor low stock items in your inventory.'] },
                workOrders: { title: 'Work Orders', items: ['Create: Click "New Work Order" to start a job. Assign a customer and vehicle.', 'Edit: Click on any work order to update its status, add line items (parts/labor), or change the technician.', 'Convert Booking: Bookings can be converted directly into active work orders.', 'Digital Vehicle Inspection: Perform comprehensive vehicle inspections linked to work orders.'] },
                inspection: { title: 'Digital Vehicle Inspection', isNew: true, items: ['Templates: Choose from pre-defined inspection templates or create default templates.', 'Traffic Light System: Mark each inspection point as Green (OK), Yellow (Monitor), or Red (Action Required).', 'Photo Evidence: Attach photos to inspection items that need attention.', 'Notes: Add detailed notes for items requiring monitoring or action.', 'Share Reports: Once completed, share via PDF, WhatsApp, SMS, or copy link.'] },
                customers: { title: 'Customers & Vehicles', items: ['Customers: Accurate database of your clients. Add new customers with contact details.', 'Vehicles: Link vehicles to customers. Track VIN, license plate, color, and mileage.', 'History: View the full service history for any vehicle.'] },
                inventory: { title: 'Inventory & Parts', items: ['Manage: Track parts, unit costs, and selling prices.', 'Low Stock: The system automatically flags items that are below the minimum stock level.'] },
                billing: { title: 'Billing & Invoices', items: ['Invoices: Generate invoices from work orders.', 'Payments: Record payments (Cash, Card, Transfer) and mark invoices as paid.'] },
                technicians: { title: 'Technician Management', items: ['Technicians: Add your staff, set their specialties and hourly rates.', 'Availability: Manage technician status (Available, Busy, Off-Duty) which affects booking slot availability.'] },
                estimates: { title: 'Estimates & Approvals', items: ['Estimates: Create estimates for potential work.', 'Approval: Send estimates to customers via email/link. They can approve or decline specific items.'] },
                bookings: { title: 'Bookings & Calendar', items: ['Calendar: View all appointments in a calendar view.', 'Slots: The system calculates available slots based on the number of working technicians.', 'Full: Slots will show as "Full" when all technicians are booked.'] },
                portal: { title: 'Customer Portal', items: ['Customers can access a dedicated portal to view their vehicle status, history, and active bookings using a secure link.', 'Inspection Reports: View completed vehicle inspection reports with photos and status indicators.'] },
                communication: { title: 'Communication', items: ['Messages: Two-way communication with customers (simulated).', 'Reminders: Set up automated service reminders for oil changes, tire rotations, etc.'] }
            },
            settings: {
                title: '4. Settings',
                shopDetails: { title: 'Shop Details', isNew: true, items: ['Shop Name: Configure your shop\'s name which appears in the sidebar and on reports.'] },
                regional: { title: 'Regional Settings', items: ['Language: Switch between English (UK), Portuguese (Portugal), French, Spanish, and German.', 'Currency & Tax: Currency and tax rates are automatically set based on the selected language.'] },
                hours: { title: 'Business Hours', items: ['Configure your shop\'s opening and closing times for each day of the week.', 'Enable or disable specific days.'] },
                email: { title: 'Email Configuration', isNew: true, items: ['Public URL: Set your application\'s public URL for correct links in emails.', 'Sender Details: Configure sender name and email address.', 'EmailJS Integration: Connect your EmailJS account for automated email notifications.'] },
                data: { title: 'Data Management', isNew: true, items: ['Backup Data: Export a complete JSON backup of your entire database.', 'Reset Transactions: Permanently delete all financial and work order history while preserving customer, vehicle, technician, and inventory data.'] }
            }
        },
        'pt-PT': {
            title: 'Ajuda e Instruções',
            subtitle: 'Guia do Utilizador',
            overview: {
                title: '1. Visão Geral',
                text: 'Bem-vindo ao CRM de Reparação Automóvel! Esta aplicação foi desenhada para ajudar oficinas a gerir as suas operações diárias, incluindo ordens de serviço, dados de clientes, histórico de veículos, inventário e muito mais.'
            },
            gettingStarted: {
                title: '2. Iniciar',
                dashboard: 'Painel: Ao entrar, verá o Painel (Dashboard), que lhe dá uma visão rápida da receita de hoje, trabalhos ativos e alertas de stock baixo.',
                navigation: 'Navegação: Utilize a barra lateral à esquerda para navegar entre diferentes secções como Ordens de Serviço, Clientes e Definições.'
            },
            features: {
                title: '3. Guias de Funcionalidades',
                dashboard: { title: 'Painel (Dashboard)', items: ['Veja indicadores chave de desempenho (KPIs).', 'Consulte a lista de técnicos ativos e o seu estado.', 'Monitorize itens com stock baixo no seu inventário.'] },
                workOrders: { title: 'Ordens de Serviço', items: ['Criar: Clique em "Nova Ordem de Serviço" para iniciar um trabalho.', 'Editar: Clique em qualquer ordem para atualizar o estado, adicionar itens ou alterar o técnico.', 'Converter Agendamento: Agendamentos podem ser convertidos em ordens de serviço.', 'Inspeção Digital: Realize inspeções abrangentes do veículo.'] },
                inspection: { title: 'Inspeção Digital do Veículo', isNew: true, items: ['Modelos: Escolha entre modelos de inspeção pré-definidos.', 'Sistema de Semáforo: Marque cada ponto como Verde (OK), Amarelo (Monitorizar), ou Vermelho (Ação Necessária).', 'Evidência Fotográfica: Anexe fotos aos itens que precisam de atenção.', 'Notas: Adicione notas detalhadas para itens que requerem ação.', 'Partilhar Relatórios: Partilhe via PDF, WhatsApp, SMS, ou copie o link.'] },
                customers: { title: 'Clientes e Veículos', items: ['Clientes: Base de dados dos seus clientes com detalhes de contacto.', 'Veículos: Associe veículos a clientes. Registe VIN, matrícula, cor e quilometragem.', 'Histórico: Veja o histórico completo de serviço de qualquer veículo.'] },
                inventory: { title: 'Inventário e Peças', items: ['Gerir: Acompanhe peças, custos unitários e preços de venda.', 'Stock Baixo: O sistema assinala automaticamente itens abaixo do nível mínimo.'] },
                billing: { title: 'Faturação', items: ['Faturas: Gere faturas a partir de ordens de serviço.', 'Pagamentos: Registe pagamentos (Dinheiro, Cartão, Transferência) e marque faturas como pagas.'] },
                technicians: { title: 'Gestão de Técnicos', items: ['Técnicos: Adicione o seu pessoal, defina especializações e custo por hora.', 'Disponibilidade: Gerencie o estado dos técnicos, o que afeta a disponibilidade de vagas.'] },
                estimates: { title: 'Orçamentos e Aprovações', items: ['Orçamentos: Crie orçamentos para trabalhos potenciais.', 'Aprovação: Envie orçamentos aos clientes por email/link.'] },
                bookings: { title: 'Agendamentos e Calendário', items: ['Calendário: Veja todos os compromissos numa vista de calendário.', 'Vagas: O sistema calcula vagas disponíveis com base nos técnicos.', 'Completo: As vagas aparecerão como "Completo" quando todos os técnicos estiverem ocupados.'] },
                portal: { title: 'Portal do Cliente', items: ['Os clientes podem aceder a um portal dedicado para ver o estado dos seus veículos.', 'Relatórios de Inspeção: Veja relatórios de inspeção com fotos e indicadores.'] },
                communication: { title: 'Comunicação', items: ['Mensagens: Comunicação bidirecional com clientes (simulada).', 'Lembretes: Configure lembretes automáticos para mudanças de óleo, etc.'] }
            },
            settings: {
                title: '4. Definições',
                shopDetails: { title: 'Detalhes da Oficina', isNew: true, items: ['Nome da Oficina: Configure o nome que aparece na barra lateral e nos relatórios.'] },
                regional: { title: 'Definições Regionais', items: ['Idioma: Alterne entre Inglês, Português, Francês, Espanhol e Alemão.', 'Moeda e Impostos: Definidos automaticamente com base no idioma.'] },
                hours: { title: 'Horário de Funcionamento', items: ['Configure os horários de abertura e fecho para cada dia.', 'Ative ou desative dias específicos.'] },
                email: { title: 'Configuração de Email', isNew: true, items: ['URL Público: Defina o URL da sua aplicação para links corretos.', 'Detalhes do Remetente: Configure nome e email do remetente.', 'Integração EmailJS: Conecte a sua conta para notificações automáticas.'] },
                data: { title: 'Gestão de Dados', isNew: true, items: ['Backup de Dados: Exporte um backup JSON completo da base de dados.', 'Limpar Transações: Elimine todo o histórico financeiro, preservando clientes e inventário.'] }
            }
        },
        'fr-FR': {
            title: 'Aide et Instructions',
            subtitle: 'Guide de l\'Utilisateur',
            overview: {
                title: '1. Aperçu',
                text: 'Bienvenue dans le CRM de Réparation Automobile ! Cette application est conçue pour aider les garages à gérer leurs opérations quotidiennes, y compris les ordres de travail, les données clients, l\'historique des véhicules, l\'inventaire et plus encore.'
            },
            gettingStarted: {
                title: '2. Pour Commencer',
                dashboard: 'Tableau de bord : Après connexion, vous verrez le tableau de bord avec un aperçu des revenus du jour, des travaux actifs et des alertes de stock bas.',
                navigation: 'Navigation : Utilisez la barre latérale pour naviguer entre les sections comme Ordres de Travail, Clients et Paramètres.'
            },
            features: {
                title: '3. Guides des Fonctionnalités',
                dashboard: { title: 'Tableau de Bord', items: ['Visualisez les indicateurs clés de performance (KPI).', 'Consultez la liste des techniciens actifs et leur statut.', 'Surveillez les articles en rupture de stock.'] },
                workOrders: { title: 'Ordres de Travail', items: ['Créer : Cliquez sur "Nouvel Ordre" pour démarrer un travail.', 'Modifier : Cliquez sur un ordre pour mettre à jour son statut ou ajouter des articles.', 'Convertir Réservation : Les réservations peuvent être converties en ordres de travail.', 'Inspection Véhicule : Effectuez des inspections complètes liées aux ordres.'] },
                inspection: { title: 'Inspection Digitale du Véhicule', isNew: true, items: ['Modèles : Choisissez parmi des modèles d\'inspection prédéfinis.', 'Système Feux Tricolores : Marquez chaque point comme Vert (OK), Jaune (Surveiller), ou Rouge (Action Requise).', 'Photos : Joignez des photos aux éléments nécessitant attention.', 'Notes : Ajoutez des notes détaillées pour les éléments nécessitant une action.', 'Partager : Partagez via PDF, WhatsApp, SMS, ou copiez le lien.'] },
                customers: { title: 'Clients et Véhicules', items: ['Clients : Base de données précise avec coordonnées.', 'Véhicules : Liez les véhicules aux clients. Suivez VIN, plaque, couleur et kilométrage.', 'Historique : Consultez l\'historique complet de service de tout véhicule.'] },
                inventory: { title: 'Inventaire et Pièces', items: ['Gérer : Suivez les pièces, coûts unitaires et prix de vente.', 'Stock Bas : Le système signale automatiquement les articles sous le niveau minimum.'] },
                billing: { title: 'Facturation', items: ['Factures : Générez des factures à partir des ordres de travail.', 'Paiements : Enregistrez les paiements (Espèces, Carte, Virement) et marquez les factures comme payées.'] },
                technicians: { title: 'Gestion des Techniciens', items: ['Techniciens : Ajoutez votre personnel, définissez spécialités et tarifs horaires.', 'Disponibilité : Gérez le statut des techniciens, ce qui affecte les créneaux disponibles.'] },
                estimates: { title: 'Devis et Approbations', items: ['Devis : Créez des devis pour les travaux potentiels.', 'Approbation : Envoyez les devis aux clients par email/lien.'] },
                bookings: { title: 'Réservations et Calendrier', items: ['Calendrier : Visualisez tous les rendez-vous dans une vue calendrier.', 'Créneaux : Le système calcule les créneaux disponibles selon les techniciens.', 'Complet : Les créneaux affichent "Complet" quand tous les techniciens sont réservés.'] },
                portal: { title: 'Portail Client', items: ['Les clients peuvent accéder à un portail dédié pour voir l\'état de leurs véhicules.', 'Rapports d\'Inspection : Consultez les rapports d\'inspection avec photos et indicateurs.'] },
                communication: { title: 'Communication', items: ['Messages : Communication bidirectionnelle avec les clients (simulée).', 'Rappels : Configurez des rappels automatiques pour vidanges, rotations de pneus, etc.'] }
            },
            settings: {
                title: '4. Paramètres',
                shopDetails: { title: 'Détails du Garage', isNew: true, items: ['Nom du Garage : Configurez le nom qui apparaît dans la barre latérale et sur les rapports.'] },
                regional: { title: 'Paramètres Régionaux', items: ['Langue : Basculez entre Anglais, Portugais, Français, Espagnol et Allemand.', 'Devise et Taxes : Définis automatiquement selon la langue sélectionnée.'] },
                hours: { title: 'Heures d\'Ouverture', items: ['Configurez les heures d\'ouverture et de fermeture pour chaque jour.', 'Activez ou désactivez des jours spécifiques.'] },
                email: { title: 'Configuration Email', isNew: true, items: ['URL Publique : Définissez l\'URL de votre application pour les liens corrects.', 'Détails Expéditeur : Configurez le nom et l\'email de l\'expéditeur.', 'Intégration EmailJS : Connectez votre compte pour les notifications automatiques.'] },
                data: { title: 'Gestion des Données', isNew: true, items: ['Sauvegarde : Exportez une sauvegarde JSON complète de votre base de données.', 'Réinitialiser Transactions : Supprimez définitivement l\'historique financier, en préservant clients et inventaire.'] }
            }
        },
        'es-ES': {
            title: 'Ayuda e Instrucciones',
            subtitle: 'Guía del Usuario',
            overview: {
                title: '1. Descripción General',
                text: '¡Bienvenido al CRM de Reparación de Automóviles! Esta aplicación está diseñada para ayudar a los talleres a gestionar sus operaciones diarias, incluyendo órdenes de trabajo, datos de clientes, historial de vehículos, inventario y más.'
            },
            gettingStarted: {
                title: '2. Primeros Pasos',
                dashboard: 'Panel: Al iniciar sesión, verá el Panel que le da una vista rápida de los ingresos de hoy, trabajos activos y alertas de stock bajo.',
                navigation: 'Navegación: Use la barra lateral izquierda para navegar entre secciones como Órdenes de Trabajo, Clientes y Configuración.'
            },
            features: {
                title: '3. Guías de Funcionalidades',
                dashboard: { title: 'Panel de Control', items: ['Vea indicadores clave de rendimiento (KPIs).', 'Consulte la lista de técnicos activos y su estado.', 'Monitoree artículos con stock bajo en su inventario.'] },
                workOrders: { title: 'Órdenes de Trabajo', items: ['Crear: Haga clic en "Nueva Orden" para iniciar un trabajo.', 'Editar: Haga clic en cualquier orden para actualizar su estado o agregar artículos.', 'Convertir Reserva: Las reservas pueden convertirse en órdenes de trabajo.', 'Inspección del Vehículo: Realice inspecciones completas vinculadas a las órdenes.'] },
                inspection: { title: 'Inspección Digital del Vehículo', isNew: true, items: ['Plantillas: Elija entre plantillas de inspección predefinidas.', 'Sistema de Semáforo: Marque cada punto como Verde (OK), Amarillo (Monitorear), o Rojo (Acción Requerida).', 'Fotos: Adjunte fotos a los elementos que necesitan atención.', 'Notas: Agregue notas detalladas para elementos que requieren acción.', 'Compartir: Comparta vía PDF, WhatsApp, SMS, o copie el enlace.'] },
                customers: { title: 'Clientes y Vehículos', items: ['Clientes: Base de datos precisa con datos de contacto.', 'Vehículos: Vincule vehículos a clientes. Registre VIN, matrícula, color y kilometraje.', 'Historial: Vea el historial completo de servicio de cualquier vehículo.'] },
                inventory: { title: 'Inventario y Repuestos', items: ['Gestionar: Controle repuestos, costos unitarios y precios de venta.', 'Stock Bajo: El sistema señala automáticamente artículos bajo el nivel mínimo.'] },
                billing: { title: 'Facturación', items: ['Facturas: Genere facturas desde órdenes de trabajo.', 'Pagos: Registre pagos (Efectivo, Tarjeta, Transferencia) y marque facturas como pagadas.'] },
                technicians: { title: 'Gestión de Técnicos', items: ['Técnicos: Agregue su personal, defina especialidades y tarifas por hora.', 'Disponibilidad: Gestione el estado de los técnicos, lo que afecta la disponibilidad de turnos.'] },
                estimates: { title: 'Presupuestos y Aprobaciones', items: ['Presupuestos: Cree presupuestos para trabajos potenciales.', 'Aprobación: Envíe presupuestos a clientes por email/enlace.'] },
                bookings: { title: 'Reservas y Calendario', items: ['Calendario: Vea todas las citas en una vista de calendario.', 'Turnos: El sistema calcula turnos disponibles según los técnicos.', 'Completo: Los turnos mostrarán "Completo" cuando todos los técnicos estén reservados.'] },
                portal: { title: 'Portal del Cliente', items: ['Los clientes pueden acceder a un portal dedicado para ver el estado de sus vehículos.', 'Informes de Inspección: Vea informes de inspección con fotos e indicadores.'] },
                communication: { title: 'Comunicación', items: ['Mensajes: Comunicación bidireccional con clientes (simulada).', 'Recordatorios: Configure recordatorios automáticos para cambios de aceite, etc.'] }
            },
            settings: {
                title: '4. Configuración',
                shopDetails: { title: 'Detalles del Taller', isNew: true, items: ['Nombre del Taller: Configure el nombre que aparece en la barra lateral y en los informes.'] },
                regional: { title: 'Configuración Regional', items: ['Idioma: Alterne entre Inglés, Portugués, Francés, Español y Alemán.', 'Moneda e Impuestos: Configurados automáticamente según el idioma.'] },
                hours: { title: 'Horario de Atención', items: ['Configure los horarios de apertura y cierre para cada día.', 'Active o desactive días específicos.'] },
                email: { title: 'Configuración de Email', isNew: true, items: ['URL Pública: Configure la URL de su aplicación para enlaces correctos.', 'Detalles del Remitente: Configure nombre y email del remitente.', 'Integración EmailJS: Conecte su cuenta para notificaciones automáticas.'] },
                data: { title: 'Gestión de Datos', isNew: true, items: ['Respaldo: Exporte una copia de seguridad JSON completa de su base de datos.', 'Restablecer Transacciones: Elimine permanentemente el historial financiero, preservando clientes e inventario.'] }
            }
        },
        'de-DE': {
            title: 'Hilfe & Anleitung',
            subtitle: 'Benutzerhandbuch',
            overview: {
                title: '1. Überblick',
                text: 'Willkommen beim Auto-Reparatur-CRM! Diese Anwendung wurde entwickelt, um Autowerkstätten bei der Verwaltung ihrer täglichen Abläufe zu unterstützen, einschließlich Arbeitsaufträge, Kundendaten, Fahrzeughistorie, Inventar und mehr.'
            },
            gettingStarted: {
                title: '2. Erste Schritte',
                dashboard: 'Dashboard: Nach der Anmeldung sehen Sie das Dashboard mit einer Übersicht über die heutigen Einnahmen, aktive Aufträge und Warnungen bei niedrigem Lagerbestand.',
                navigation: 'Navigation: Verwenden Sie die linke Seitenleiste, um zwischen Bereichen wie Arbeitsaufträge, Kunden und Einstellungen zu navigieren.'
            },
            features: {
                title: '3. Funktionsanleitungen',
                dashboard: { title: 'Dashboard', items: ['Sehen Sie wichtige Leistungsindikatoren (KPIs).', 'Sehen Sie die Liste der aktiven Techniker und deren Status.', 'Überwachen Sie Artikel mit niedrigem Lagerbestand.'] },
                workOrders: { title: 'Arbeitsaufträge', items: ['Erstellen: Klicken Sie auf "Neuer Auftrag", um einen Auftrag zu starten.', 'Bearbeiten: Klicken Sie auf einen Auftrag, um den Status zu aktualisieren oder Artikel hinzuzufügen.', 'Buchung Umwandeln: Buchungen können in Arbeitsaufträge umgewandelt werden.', 'Fahrzeuginspektion: Führen Sie umfassende Inspektionen durch.'] },
                inspection: { title: 'Digitale Fahrzeuginspektion', isNew: true, items: ['Vorlagen: Wählen Sie aus vordefinierten Inspektionsvorlagen.', 'Ampelsystem: Markieren Sie jeden Punkt als Grün (OK), Gelb (Überwachen) oder Rot (Handlung Erforderlich).', 'Fotos: Fügen Sie Fotos zu Elementen hinzu, die Aufmerksamkeit erfordern.', 'Notizen: Fügen Sie detaillierte Notizen für Elemente hinzu, die Maßnahmen erfordern.', 'Teilen: Teilen Sie per PDF, WhatsApp, SMS oder kopieren Sie den Link.'] },
                customers: { title: 'Kunden & Fahrzeuge', items: ['Kunden: Genaue Datenbank mit Kontaktdaten.', 'Fahrzeuge: Verknüpfen Sie Fahrzeuge mit Kunden. Erfassen Sie VIN, Kennzeichen, Farbe und Kilometerstand.', 'Historie: Sehen Sie die komplette Servicehistorie jedes Fahrzeugs.'] },
                inventory: { title: 'Inventar & Teile', items: ['Verwalten: Verfolgen Sie Teile, Stückkosten und Verkaufspreise.', 'Niedriger Bestand: Das System markiert automatisch Artikel unter dem Mindestbestand.'] },
                billing: { title: 'Abrechnung', items: ['Rechnungen: Erstellen Sie Rechnungen aus Arbeitsaufträgen.', 'Zahlungen: Erfassen Sie Zahlungen (Bar, Karte, Überweisung) und markieren Sie Rechnungen als bezahlt.'] },
                technicians: { title: 'Technikerverwaltung', items: ['Techniker: Fügen Sie Ihr Personal hinzu, legen Sie Spezialisierungen und Stundensätze fest.', 'Verfügbarkeit: Verwalten Sie den Status der Techniker, was die Verfügbarkeit von Terminen beeinflusst.'] },
                estimates: { title: 'Kostenvoranschläge', items: ['Kostenvoranschläge: Erstellen Sie Kostenvoranschläge für potenzielle Arbeiten.', 'Genehmigung: Senden Sie Kostenvoranschläge an Kunden per E-Mail/Link.'] },
                bookings: { title: 'Buchungen & Kalender', items: ['Kalender: Sehen Sie alle Termine in einer Kalenderansicht.', 'Zeitfenster: Das System berechnet verfügbare Zeitfenster basierend auf den Technikern.', 'Voll: Zeitfenster zeigen "Voll" an, wenn alle Techniker gebucht sind.'] },
                portal: { title: 'Kundenportal', items: ['Kunden können auf ein Portal zugreifen, um den Status ihrer Fahrzeuge zu sehen.', 'Inspektionsberichte: Sehen Sie Inspektionsberichte mit Fotos und Indikatoren.'] },
                communication: { title: 'Kommunikation', items: ['Nachrichten: Bidirektionale Kommunikation mit Kunden (simuliert).', 'Erinnerungen: Richten Sie automatische Erinnerungen für Ölwechsel usw. ein.'] }
            },
            settings: {
                title: '4. Einstellungen',
                shopDetails: { title: 'Werkstattdetails', isNew: true, items: ['Werkstattname: Konfigurieren Sie den Namen, der in der Seitenleiste und auf Berichten erscheint.'] },
                regional: { title: 'Regionale Einstellungen', items: ['Sprache: Wechseln Sie zwischen Englisch, Portugiesisch, Französisch, Spanisch und Deutsch.', 'Währung & Steuern: Werden automatisch basierend auf der Sprache festgelegt.'] },
                hours: { title: 'Geschäftszeiten', items: ['Konfigurieren Sie Öffnungs- und Schließzeiten für jeden Tag.', 'Aktivieren oder deaktivieren Sie bestimmte Tage.'] },
                email: { title: 'E-Mail-Konfiguration', isNew: true, items: ['Öffentliche URL: Legen Sie die URL Ihrer Anwendung für korrekte Links fest.', 'Absenderdetails: Konfigurieren Sie Absendername und E-Mail-Adresse.', 'EmailJS-Integration: Verbinden Sie Ihr Konto für automatische Benachrichtigungen.'] },
                data: { title: 'Datenverwaltung', isNew: true, items: ['Datensicherung: Exportieren Sie eine vollständige JSON-Sicherung Ihrer Datenbank.', 'Transaktionen Zurücksetzen: Löschen Sie dauerhaft die Finanzhistorie, wobei Kunden und Inventar erhalten bleiben.'] }
            }
        }
    };

    const c = content[lang as keyof typeof content] || content['en-GB'];
    const newBadge = <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">NEW</span>;

    const renderSection = (section: { title: string; isNew?: boolean; items: string[] }) => (
        <>
            <h4>{section.title} {section.isNew && newBadge}</h4>
            <ul>
                {section.items.map((item, idx) => {
                    const parts = item.split(': ');
                    return parts.length > 1 ? (
                        <li key={idx}><strong>{parts[0]}</strong>: {parts.slice(1).join(': ')}</li>
                    ) : (
                        <li key={idx}>{item}</li>
                    );
                })}
            </ul>
        </>
    );

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[32px] font-bold text-foreground">{c.title}</h1>
                    <p className="text-muted-foreground">{c.subtitle}</p>
                </div>
            </div>

            <Card className="flex-1 overflow-hidden border-border bg-card">
                <div className="h-full p-6 overflow-y-auto">
                    <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
                        <section>
                            <h3>{c.overview.title}</h3>
                            <p>{c.overview.text}</p>
                        </section>

                        <section>
                            <h3>{c.gettingStarted.title}</h3>
                            <ul>
                                <li><strong>{c.gettingStarted.dashboard.split(': ')[0]}</strong>: {c.gettingStarted.dashboard.split(': ').slice(1).join(': ')}</li>
                                <li><strong>{c.gettingStarted.navigation.split(': ')[0]}</strong>: {c.gettingStarted.navigation.split(': ').slice(1).join(': ')}</li>
                            </ul>
                        </section>

                        <section>
                            <h3>{c.features.title}</h3>
                            {renderSection(c.features.dashboard)}
                            {renderSection(c.features.workOrders)}
                            {renderSection(c.features.inspection)}
                            {renderSection(c.features.customers)}
                            {renderSection(c.features.inventory)}
                            {renderSection(c.features.billing)}
                            {renderSection(c.features.technicians)}
                            {renderSection(c.features.estimates)}
                            {renderSection(c.features.bookings)}
                            {renderSection(c.features.portal)}
                            {renderSection(c.features.communication)}
                        </section>

                        <section>
                            <h3>{c.settings.title}</h3>
                            {renderSection(c.settings.shopDetails)}
                            {renderSection(c.settings.regional)}
                            {renderSection(c.settings.hours)}
                            {renderSection(c.settings.email)}
                            {renderSection(c.settings.data)}
                        </section>
                    </div>
                </div>
            </Card>
        </div>
    );
}

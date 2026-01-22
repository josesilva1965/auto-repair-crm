import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/card';
import { HelpCircle } from 'lucide-react';

export function Help() {
    const { i18n } = useTranslation();
    const isPt = i18n.language === 'pt-PT';

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[32px] font-bold text-foreground">
                        {isPt ? 'Ajuda e Instruções' : 'Help & Instructions'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isPt ? 'Guia do Utilizador' : 'User Guide'}
                    </p>
                </div>
            </div>

            <Card className="flex-1 overflow-hidden border-border bg-card">
                <div className="h-full p-6 overflow-y-auto">
                    <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
                        {/* English Content */}
                        <div className={isPt ? 'hidden' : 'block'}>
                            <section>
                                <h3>1. Overview</h3>
                                <p>Welcome to the Auto Repair CRM! This application is designed to help auto repair shops manage their daily operations, including work orders, customer data, vehicle history, inventory, and more.</p>
                            </section>

                            <section>
                                <h3>2. Getting Started</h3>
                                <ul>
                                    <li><strong>Dashboard</strong>: Upon logging in, you will see the Dashboard, which gives you a quick overview of today's revenue, active jobs, and low stock alerts.</li>
                                    <li><strong>Navigation</strong>: Use the sidebar on the left to navigate between different sections like Work Orders, Customers, and Settings.</li>
                                </ul>
                            </section>

                            <section>
                                <h3>3. Feature Guides</h3>

                                <h4>Dashboard</h4>
                                <ul>
                                    <li>View key performance indicators (KPIs).</li>
                                    <li>See a list of active technicians and their status.</li>
                                    <li>Monitor low stock items in your inventory.</li>
                                </ul>

                                <h4>Work Orders</h4>
                                <ul>
                                    <li><strong>Create</strong>: Click "New Work Order" to start a job. Assign a customer and vehicle.</li>
                                    <li><strong>Edit</strong>: Click on any work order to update its status, add line items (parts/labor), or change the technician.</li>
                                    <li><strong>Convert Booking</strong>: Bookings can be converted directly into active work orders.</li>
                                </ul>

                                <h4>Customers & Vehicles</h4>
                                <ul>
                                    <li><strong>Customers</strong>: Accurate database of your clients. Add new customers with contact details.</li>
                                    <li><strong>Vehicles</strong>: Link vehicles to customers. Track VIN, license plate, color, and mileage.</li>
                                    <li><strong>History</strong>: View the full service history for any vehicle.</li>
                                </ul>

                                <h4>Inventory & Parts</h4>
                                <ul>
                                    <li><strong>Manage</strong>: Track parts, unit costs, and selling prices.</li>
                                    <li><strong>Low Stock</strong>: The system automatically flags items that are below the minimum stock level.</li>
                                </ul>

                                <h4>Billing & Invoices</h4>
                                <ul>
                                    <li><strong>Invoices</strong>: Generate invoices from work orders.</li>
                                    <li><strong>Payments</strong>: Record payments (Cash, Card, Transfer) and mark invoices as paid.</li>
                                </ul>

                                <h4>Technician Management</h4>
                                <ul>
                                    <li><strong>Technicians</strong>: Add your staff, set their specialties and hourly rates.</li>
                                    <li><strong>Availability</strong>: Manage technician status (Available, Busy, Off-Duty) which affects booking slot availability.</li>
                                </ul>

                                <h4>Estimates & Approvals</h4>
                                <ul>
                                    <li><strong>Estimates</strong>: Create estimates for potential work.</li>
                                    <li><strong>Approval</strong>: Send estimates to customers via email/link. They can approve or decline specific items.</li>
                                </ul>

                                <h4>Bookings & Calendar</h4>
                                <ul>
                                    <li><strong>Calendar</strong>: View all appointments in a calendar view.</li>
                                    <li><strong>Slots</strong>: The system calculates available slots based on the number of working technicians.</li>
                                    <li><strong>Full</strong>: Slots will show as "Full" when all technicians are booked.</li>
                                </ul>

                                <h4>Customer Portal</h4>
                                <ul>
                                    <li>Customers can access a dedicated portal to view their vehicle status, history, and active bookings using a secure link.</li>
                                </ul>

                                <h4>Communication</h4>
                                <ul>
                                    <li><strong>Messages</strong>: Two-way communication with customers (simulated).</li>
                                    <li><strong>Reminders</strong>: Set up automated service reminders for oil changes, tire rotations, etc.</li>
                                </ul>
                            </section>

                            <section>
                                <h3>4. Settings</h3>
                                <ul>
                                    <li><strong>Business Hours</strong>: Configure your shop's opening and closing times.</li>
                                    <li><strong>Currency & Tax</strong>: Set your local currency and default tax rate.</li>
                                    <li><strong>Language</strong>: Switch between English and Portuguese. Changing the language also adapts currency formats.</li>
                                </ul>
                            </section>
                        </div>

                        {/* Portuguese Content */}
                        <div className={!isPt ? 'hidden' : 'block'}>
                            <section>
                                <h3>1. Visão Geral</h3>
                                <p>Bem-vindo ao CRM de Reparação Automóvel! Esta aplicação foi desenhada para ajudar oficinas a gerir as suas operações diárias, incluindo ordens de serviço, dados de clientes, histórico de veículos, inventário e muito mais.</p>
                            </section>

                            <section>
                                <h3>2. Iniciar</h3>
                                <ul>
                                    <li><strong>Painel</strong>: Ao entrar, verá o Painel (Dashboard), que lhe dá uma visão rápida da receita de hoje, trabalhos ativos e alertas de stock baixo.</li>
                                    <li><strong>Navegação</strong>: Utilize a barra lateral à esquerda para navegar entre diferentes secções como Ordens de Serviço, Clientes e Definições.</li>
                                </ul>
                            </section>

                            <section>
                                <h3>3. Guias de Funcionalidades</h3>

                                <h4>Painel (Dashboard)</h4>
                                <ul>
                                    <li>Veja indicadores chave de desempenho (KPIs).</li>
                                    <li>Consulte a lista de técnicos ativos e o seu estado.</li>
                                    <li>Monitorize itens com stock baixo no seu inventário.</li>
                                </ul>

                                <h4>Ordens de Serviço</h4>
                                <ul>
                                    <li><strong>Criar</strong>: Clique em "Nova Ordem de Serviço" para iniciar um trabalho. Atribua um cliente e veículo.</li>
                                    <li><strong>Editar</strong>: Clique em qualquer ordem para atualizar o estado, adicionar itens (peças/mão de obra) ou alterar o técnico.</li>
                                    <li><strong>Converter Agendamento</strong>: Agendamentos podem ser convertidos diretamente em ordens de serviço ativas.</li>
                                </ul>

                                <h4>Clientes e Veículos</h4>
                                <ul>
                                    <li><strong>Clientes</strong>: Base de dados precisa dos seus clientes. Adicione novos clientes com detalhes de contacto.</li>
                                    <li><strong>Veículos</strong>: Associe veículos a clientes. Registe VIN, matrícula, cor e quilometragem.</li>
                                    <li><strong>Histórico</strong>: Veja o histórico completo de serviço de qualquer veículo.</li>
                                </ul>

                                <h4>Inventário e Peças</h4>
                                <ul>
                                    <li><strong>Gerir</strong>: Acompanhe peças, custos unitários e preços de venda.</li>
                                    <li><strong>Stock Baixo</strong>: O sistema assinala automaticamente itens abaixo do nível mínimo de stock.</li>
                                </ul>

                                <h4>Faturação</h4>
                                <ul>
                                    <li><strong>Faturas</strong>: Gere faturas a partir de ordens de serviço.</li>
                                    <li><strong>Pagamentos</strong>: Registe pagamentos (Dinheiro, Cartão, Transferência) e marque faturas como pagas.</li>
                                </ul>

                                <h4>Gestão de Técnicos</h4>
                                <ul>
                                    <li><strong>Técnicos</strong>: Adicione o seu pessoal, defina especializações e custo por hora.</li>
                                    <li><strong>Disponibilidade</strong>: Gerencie o estado dos técnicos (Disponível, Ocupado, Fora de Serviço), o que afeta a disponibilidade de vagas para agendamento.</li>
                                </ul>

                                <h4>Orçamentos e Aprovações</h4>
                                <ul>
                                    <li><strong>Orçamentos</strong>: Crie orçamentos para trabalhos potenciais.</li>
                                    <li><strong>Aprovação</strong>: Envie orçamentos aos clientes por email/link. Eles podem aprovar ou rejeitar itens específicos.</li>
                                </ul>

                                <h4>Agendamentos e Calendário</h4>
                                <ul>
                                    <li><strong>Calendário</strong>: Veja todos os compromissos numa vista de calendário.</li>
                                    <li><strong>Vagas</strong>: O sistema calcula vagas disponíveis com base no número de técnicos a trabalhar.</li>
                                    <li><strong>Completo</strong>: As vagas aparecerão como "Completo" quando todos os técnicos estiverem ocupados.</li>
                                </ul>

                                <h4>Portal do Cliente</h4>
                                <ul>
                                    <li>Os clientes podem aceder a um portal dedicado para ver o estado dos seus veículos, histórico e agendamentos ativos usando um link seguro.</li>
                                </ul>

                                <h4>Comunicação</h4>
                                <ul>
                                    <li><strong>Mensagens</strong>: Comunicação bidirecional com clientes (simulada).</li>
                                    <li><strong>Lembretes</strong>: Configure lembretes automáticos para mudanças de óleo, rotação de pneus, etc.</li>
                                </ul>
                            </section>

                            <section>
                                <h3>4. Definições</h3>
                                <ul>
                                    <li><strong>Horário de Funcionamento</strong>: Configure os horários de abertura e fecho da sua oficina.</li>
                                    <li><strong>Moeda e Impostos</strong>: Defina a sua moeda local e taxa de imposto padrão.</li>
                                    <li><strong>Idioma</strong>: Alterne entre Inglês e Português. Alterar o idioma também adapta os formatos de moeda.</li>
                                </ul>
                            </section>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

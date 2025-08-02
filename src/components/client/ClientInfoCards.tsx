import { Client } from '@/types';
import { CATEGORY_LABELS } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
interface ClientInfoCardsProps {
  client: Client;
}
export const ClientInfoCards = ({
  client
}: ClientInfoCardsProps) => {
  const getBirthDateString = () => {
    if (!client.birthDate) return 'Não informado';
    const birthDate = new Date(client.birthDate);
    const formattedDate = birthDate.toLocaleDateString('pt-BR');
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    return `${formattedDate} (${age} anos)`;
  };
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mx-0 px-0 py-[38px]">
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome</p>
              <p>{client.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPF</p>
              <p>{client.cpf}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
              <p>{getBirthDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gênero</p>
              <p>{client.gender === 'male' ? 'Masculino' : client.gender === 'female' ? 'Feminino' : client.gender === 'non-binary' ? 'Não binário' : 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nacionalidade</p>
              <p>{client.nationality || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estado Civil</p>
              <p>{client.maritalStatus === 'single' ? 'Solteiro(a)' : client.maritalStatus === 'married' ? 'Casado(a)' : client.maritalStatus === 'widowed' ? 'Viúvo(a)' : client.maritalStatus === 'divorced' ? 'Divorciado(a)' : client.maritalStatus === 'stable-union' ? 'União estável' : client.maritalStatus === 'legally-separated' ? 'Separado(a) judicialmente' : 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Profissão</p>
              <p>{client.profession || 'Não informado'}</p>
            </div>
            {client.rg && <div>
                <p className="text-sm font-medium text-muted-foreground">RG</p>
                <p>{client.rg.number} {client.rg.issuingBody ? `(${client.rg.issuingBody})` : ''}</p>
              </div>}
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Senha do GOV</p>
            <p>{client.govPassword ? '********' : 'Não informado'}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Contato e Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{client.email || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Telefone</p>
              <p>{client.phone || 'Não informado'}</p>
            </div>
          </div>
          
          {client.address && <div>
              <p className="text-sm font-medium text-muted-foreground">Endereço</p>
              <p>
                {client.address.street}, {client.address.number} - {client.address.neighborhood} <br />
                {client.address.city} - {client.address.state}, CEP {client.address.zipCode}
              </p>
            </div>}
          
          {client.respondent && Object.values(client.respondent).some(value => value && value.trim() !== '') && <div className="pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">Requerido</p>
              <div>
                {client.respondent.name && <p><span className="font-medium">Nome:</span> {client.respondent.name}</p>}
                {client.respondent.address && <p><span className="font-medium">Endereço:</span> {client.respondent.address}</p>}
                {client.respondent.cpf && <p><span className="font-medium">CPF:</span> {client.respondent.cpf}</p>}
              </div>
            </div>}
        </CardContent>
      </Card>
    </div>;
};
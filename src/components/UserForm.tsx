            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              placeholder="Selecione o cargo"
              isRequired
            >
              <option value={UserRole.ADMIN}>Administrador</option>
              <option value={UserRole.TEACHER}>Professor</option>
              <option value={UserRole.STUDENT}>Aluno</option>
              <option value={UserRole.DESIGNER}>Designer</option>
            </Select> 